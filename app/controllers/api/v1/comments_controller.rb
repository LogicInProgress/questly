module Api
  module V1
    class CommentsController < BaseController
      before_action :set_objective, only: [ :index, :create ]
      before_action :set_comment, only: [ :destroy ]

      # GET /api/v1/objectives/:objective_id/comments
      def index
        render json: { comments: comments_json(@objective.comments) }
      end

      # POST /api/v1/objectives/:objective_id/comments
      def create
        comment = @objective.comments.create!(user: current_user, body: params[:body])
        Activity.create!(list: @objective.list, user: current_user, action: "comment.created", target: comment)
        ListBroadcaster.comment_created(comment, actor: current_user)

        render json: { comment: CommentResource.new(comment).serializable_hash }, status: :created
      end

      # DELETE /api/v1/comments/:id — author or host only.
      def destroy
        unless @comment.user_id == current_user.id || current_membership&.host?
          return render_error(:forbidden, "not_allowed", "You can only delete your own comments.")
        end

        @comment.destroy!
        head :no_content
      end

      private

      def set_objective
        @objective = Objective.find(params[:objective_id])
        require_membership_in!(@objective.list)
      end

      def set_comment
        @comment = Comment.find(params[:id])
        require_membership_in!(@comment.objective.list)
      end

      def comments_json(comments)
        CommentResource.new(comments.includes(:user).order(:created_at)).serializable_hash
      end
    end
  end
end
