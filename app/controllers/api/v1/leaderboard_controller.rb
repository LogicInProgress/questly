module Api
  module V1
    class LeaderboardController < BaseController
      before_action :require_member!

      # GET /api/v1/lists/:code/leaderboard — members ranked by per-quest XP.
      def index
        members = current_list.memberships.includes(:user).order(xp_in_list: :desc, joined_at: :asc)
        done_counts = current_list.objectives.done.group(:completed_by_id).count

        rows = members.each_with_index.map do |membership, index|
          MiniUserResource.new(membership.user).serializable_hash.merge(
            rank: index + 1,
            role: membership.role,
            xpInList: membership.xp_in_list,
            doneCount: done_counts[membership.user_id] || 0
          )
        end

        render json: { leaderboard: rows }
      end
    end
  end
end
