module Api
  module V1
    class MembersController < BaseController
      before_action :require_member!, only: [ :index ]
      before_action :require_host!, only: [ :destroy ]

      # GET /api/v1/lists/:code/members — party roster (for assignee picker + S12).
      def index
        members = current_list.memberships.includes(:user).order(joined_at: :asc)
        done_counts = current_list.objectives.done.group(:completed_by_id).count

        render json: {
          members: members.map do |m|
            MiniUserResource.new(m.user).serializable_hash.merge(
              role: m.role,
              xpInList: m.xp_in_list,
              doneCount: done_counts[m.user_id] || 0
            )
          end
        }
      end

      # DELETE /api/v1/lists/:code/members/:user_id — host removes a member.
      def destroy
        membership = current_list.memberships.find_by(user_id: params[:user_id])
        return render_error(:not_found, "not_found", "Not in this quest.") unless membership
        return render_error(:forbidden, "cannot_remove_host", "The host can't be removed.") if membership.host?

        user_id = membership.user_id
        membership.destroy!
        ListBroadcaster.member_left(current_list.id, user_id)
        head :no_content
      end
    end
  end
end
