module Api
  module V1
    class MeController < BaseController
      # GET /api/v1/me — current user + memberships + aggregate stats.
      def show
        render json: {
          user: UserResource.new(current_user).serializable_hash,
          memberships: membership_payloads,
          stats: stats_payload
        }
      end

      # GET /api/v1/me/stats
      def stats
        render json: { stats: stats_payload }
      end

      # PATCH /api/v1/me — edit display name / avatar.
      def update
        current_user.update!(params.permit(:display_name, :avatar_emoji))
        render json: { user: UserResource.new(current_user).serializable_hash }
      end

      # GET /api/v1/me/achievements — full catalog with earned flags + progress.
      def achievements
        earned = current_user.user_achievements.index_by(&:achievement_id)

        catalog = Achievement.order(:id).map do |achievement|
          user_achievement = earned[achievement.id]
          progress = Achievements.progress_for(current_user, achievement.code)

          AchievementResource.new(achievement).serializable_hash.merge(
            earned: user_achievement.present?,
            earnedAt: user_achievement&.earned_at,
            progress: progress && { current: progress[0], target: progress[1] }
          )
        end

        render json: { achievements: catalog, earnedCount: earned.size, total: catalog.size }
      end

      private

      def membership_payloads
        current_user.memberships.includes(:list).map do |m|
          list = m.list
          total = list.objectives.count
          done = list.objectives.done.count
          {
            role: m.role,
            xpInList: m.xp_in_list,
            list: ListResource.new(list).serializable_hash.merge(
              progress: { total: total, done: done }
            )
          }
        end
      end

      def stats_payload
        {
          questsCount: current_user.memberships.count,
          clearedCount: Objective.done.where(completed_by_id: current_user.id).count,
          badgesCount: current_user.user_achievements.count
        }
      end
    end
  end
end
