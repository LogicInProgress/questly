module Api
  module V1
    class ObjectivesController < BaseController
      before_action :require_member!, only: [ :index, :create ]
      before_action :set_objective, only: [ :show, :update, :destroy, :complete, :reopen ]

      # GET /api/v1/lists/:list_code/objectives?tag=&status=&due=soon
      def index
        scope = current_list.objectives
                            .includes(:assignee, :completer, :tags, :loot_links)
                            .ordered

        scope = scope.where(status: params[:status]) if Objective.statuses.key?(params[:status])
        scope = scope.due_soon if params[:due] == "soon"
        scope = scope.joins(:objective_tags).where(objective_tags: { tag_id: params[:tag] }) if params[:tag].present?

        render json: { objectives: ObjectiveResource.new(scope).serializable_hash }
      end

      # POST /api/v1/lists/:list_code/objectives
      def create
        objective = current_list.objectives.new(objective_params)
        objective.creator = current_user
        objective.position = (current_list.objectives.maximum(:position) || -1) + 1
        assign_tags(objective)
        objective.save!

        Activity.create!(list: current_list, user: current_user, action: "objective.created", target: objective)
        ListBroadcaster.objective_created(objective.reload, actor: current_user)

        render json: { objective: ObjectiveResource.new(objective).serializable_hash }, status: :created
      end

      # GET /api/v1/objectives/:id — detail incl. loot links, tags, comments.
      def show
        render json: { objective: detail_json(@objective) }
      end

      # PATCH /api/v1/objectives/:id
      def update
        @objective.assign_attributes(objective_params)
        assign_tags(@objective) if params.key?(:tag_ids)
        @objective.save!
        ListBroadcaster.objective_updated(@objective.reload, actor: current_user)
        render json: { objective: detail_json(@objective) }
      end

      # DELETE /api/v1/objectives/:id
      def destroy
        list_id = @objective.list_id
        id = @objective.id
        @objective.destroy!
        ListBroadcaster.objective_deleted(list_id, id, actor: current_user)
        head :no_content
      end

      # POST /api/v1/objectives/:id/complete — sets done, awards XP.
      def complete
        return render_error(:unprocessable_entity, "already_done", "That's already complete.") if @objective.done?

        @objective.update!(status: :done, completer: current_user, completed_at: Time.current)
        award = Gamification.award_completion(@objective, current_user)
        Activity.create!(list: @objective.list, user: current_user, action: "objective.completed",
                         target: @objective, meta: { xp: award.xp })

        membership = @objective.list.memberships.find_by(user_id: current_user.id)
        ListBroadcaster.objective_completed(@objective.reload, actor: current_user, xp: award.xp, membership: membership)
        ListBroadcaster.member_xp_changed(@objective.list_id, current_user.id, award.xp_in_list, award.level)
        announce_achievements(award.grants)

        render json: {
          objective: detail_json(@objective),
          xpAwarded: award.xp,
          xpTotal: current_user.xp_total,
          level: award.level,
          leveledUp: award.leveled_up,
          newAchievements: award.grants.select { |g| g.user.id == current_user.id }
                                .map { |g| AchievementResource.new(g.achievement).serializable_hash }
        }
      end

      # POST /api/v1/objectives/:id/reopen — reverts to open (no XP claw-back in v1).
      def reopen
        @objective.update!(status: :open, completer: nil, completed_at: nil)
        ListBroadcaster.objective_reopened(@objective.reload, actor: current_user)
        render json: { objective: detail_json(@objective) }
      end

      private

      def announce_achievements(grants)
        grants.each do |grant|
          Activity.create!(list: @objective.list, user: grant.user, action: "achievement.earned", target: grant.achievement)
          ListBroadcaster.achievement_earned(@objective.list_id, grant.user, grant.achievement)
        end
      end

      def set_objective
        @objective = Objective.includes(:list, :assignee, :completer, :tags, :loot_links).find(params[:id])
        require_membership_in!(@objective.list)
      end

      def detail_json(objective)
        ObjectiveResource.new(objective).serializable_hash.merge(
          comments: CommentResource.new(objective.comments.includes(:user).order(:created_at)).serializable_hash
        )
      end

      def objective_params
        params.permit(:title, :description, :due_on, :priority, :assignee_id, :emoji)
      end

      def assign_tags(objective)
        tag_ids = Array(params[:tag_ids]).map(&:to_i).uniq
        objective.tags = objective.list.tags.where(id: tag_ids)
      end
    end
  end
end
