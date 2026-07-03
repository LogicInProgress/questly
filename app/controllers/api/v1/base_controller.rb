module Api
  module V1
    class BaseController < ApplicationController
      before_action :require_authentication!

      rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :handle_invalid
      rescue_from ActionController::ParameterMissing, with: :handle_param_missing
      rescue_from ActionController::InvalidAuthenticityToken, with: :handle_invalid_csrf

      private

      def current_user
        @current_user ||= User.find_by(id: session[:user_id])
      end
      helper_method :current_user

      def require_authentication!
        return if current_user

        render_error(:unauthorized, "not_authenticated", "Sign in to continue.")
      end

      # List-scoped routes use :code (top-level) or :list_code (nested).
      def current_list
        code = (params[:code] || params[:list_code]).to_s.strip.upcase
        @current_list ||= List.find_by!(join_code: code)
      end

      def current_membership
        return unless current_user

        @current_membership ||= current_list.memberships.find_by(user_id: current_user.id)
      end

      def require_member!
        return if current_membership

        render_error(:forbidden, "not_a_member", "You're not in this quest.")
      end

      # For shallow routes (/objectives/:id, /loot_links/:id, …) where the list is
      # derived from the resource rather than a :code param.
      def require_membership_in!(list)
        @current_list = list
        @current_membership = nil
        require_member!
      end

      def require_host!
        require_member!
        return if performed?
        return if current_membership.host?

        render_error(:forbidden, "not_host", "Only the host can do that.")
      end

      def render_error(status, code, message, extra = {})
        render json: { error: { code: code, message: message }.merge(extra) }, status: status
      end

      def handle_not_found(_error)
        render_error(:not_found, "not_found", "That doesn't exist.")
      end

      def handle_invalid(error)
        render_error(:unprocessable_entity, "invalid", error.record.errors.full_messages.to_sentence)
      end

      def handle_param_missing(error)
        render_error(:bad_request, "param_missing", error.message)
      end

      def handle_invalid_csrf(_error)
        render_error(:unprocessable_entity, "invalid_csrf", "Your session expired. Refresh and try again.")
      end
    end
  end
end
