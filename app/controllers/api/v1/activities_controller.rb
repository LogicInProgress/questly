module Api
  module V1
    class ActivitiesController < BaseController
      before_action :require_member!

      # GET /api/v1/lists/:list_code/activities — recent party activity (S15 feed).
      def index
        activities = current_list.activities.includes(:user).recent.limit(50)
        render json: { activities: ActivityResource.new(activities).serializable_hash }
      end
    end
  end
end
