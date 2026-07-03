module Api
  module V1
    class TagsController < BaseController
      before_action :require_member!, only: [ :index, :create ]
      before_action :set_tag, only: [ :update, :destroy ]

      # GET /api/v1/lists/:list_code/tags — tags with objective counts.
      def index
        tags = current_list.tags
                           .left_joins(:objective_tags)
                           .select("tags.*, COUNT(objective_tags.id) AS objectives_count")
                           .group("tags.id")
                           .order(:name)

        render json: { tags: TagResource.new(tags).serializable_hash }
      end

      # POST /api/v1/lists/:list_code/tags
      def create
        tag = current_list.tags.create!(tag_params)
        Activity.create!(list: current_list, user: current_user, action: "tag.created", target: tag)
        ListBroadcaster.tag_created(tag, actor: current_user)
        render json: { tag: TagResource.new(tag).serializable_hash }, status: :created
      end

      # PATCH /api/v1/tags/:id
      def update
        @tag.update!(tag_params)
        render json: { tag: TagResource.new(@tag).serializable_hash }
      end

      # DELETE /api/v1/tags/:id
      def destroy
        @tag.destroy!
        head :no_content
      end

      private

      def set_tag
        @tag = Tag.find(params[:id])
        require_membership_in!(@tag.list)
      end

      def tag_params
        params.permit(:name, :emoji, :color)
      end
    end
  end
end
