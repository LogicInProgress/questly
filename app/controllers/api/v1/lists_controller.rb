module Api
  module V1
    class ListsController < BaseController
      before_action :require_member!, only: [ :show, :leave ]
      before_action :require_host!, only: [ :update, :destroy ]

      # GET /api/v1/lists — the current user's quests (dashboard).
      def index
        memberships = current_user.memberships
                                  .includes(list: [ :objectives, { memberships: :user } ])
                                  .order(joined_at: :desc)

        render json: { lists: memberships.map { |m| quest_card(m) } }
      end

      # GET /api/v1/lists/:code — quest header/detail.
      def show
        list = current_list
        total = list.objectives.count
        done = list.objectives.done.count

        render json: {
          list: ListResource.new(list).serializable_hash.merge(
            progress: { total: total, done: done },
            membersCount: list.memberships.count,
            role: current_membership.role
          )
        }
      end

      # POST /api/v1/lists — create a quest (S04).
      def create
        result = QuestCreator.new(user: current_user, params: create_params).call

        render json: {
          list: ListResource.new(result.list).serializable_hash.merge(
            membership: { role: result.membership.role, xpInList: result.membership.xp_in_list }
          )
        }, status: :created
      end

      # PATCH /api/v1/lists/:code — host: rename / emblem / password / colour.
      def update
        current_list.update!(update_params)
        ListBroadcaster.list_updated(current_list)

        render json: {
          list: ListResource.new(current_list).serializable_hash.merge(
            progress: { total: current_list.objectives.count, done: current_list.objectives.done.count },
            membersCount: current_list.memberships.count,
            role: current_membership.role
          )
        }
      end

      # DELETE /api/v1/lists/:code — host: delete the quest.
      def destroy
        current_list.destroy!
        head :no_content
      end

      # DELETE /api/v1/lists/:code/leave — member leaves (host must delete instead).
      def leave
        if current_membership.host?
          return render_error(:forbidden, "host_cannot_leave", "Hosts delete the quest instead of leaving.")
        end

        user_id = current_user.id
        current_membership.destroy!
        ListBroadcaster.member_left(current_list.id, user_id)
        head :no_content
      end

      private

      def update_params
        permitted = params.permit(:name, :emblem_emoji, :description, :cover_color, :password)
        permitted.delete(:password) if permitted[:password].blank? # blank = keep current
        permitted
      end

      def quest_card(membership)
        list = membership.list
        total = list.objectives.size
        done = list.objectives.count(&:done?)
        {
          role: membership.role,
          xpInList: membership.xp_in_list,
          list: ListResource.new(list).serializable_hash.merge(
            progress: { total: total, done: done },
            members: list.memberships.map { |m| MiniUserResource.new(m.user).serializable_hash }
          )
        }
      end

      def create_params
        params.permit(
          :name, :emblem_emoji, :description, :cover_color, :password, :template_key,
          tags: [ :name, :emoji, :color ]
        )
      end
    end
  end
end
