module Api
  module V1
    class AuthController < BaseController
      skip_before_action :require_authentication!

      FAILURE_LIMIT = 3
      COOLDOWN_SECONDS = 60
      WELCOME_XP = 50

      # POST /api/v1/auth/join
      # The single entry point for access. Sets the session cookie on success.
      def create
        email = normalized_email
        code  = normalized_code
        return render_error(:bad_request, "param_missing", "Email and quest code are required.") if email.blank? || code.blank?

        list = List.find_by(join_code: code)
        return render_error(:not_found, "code_not_found", "No quest with that code. Check with the host.") unless list

        if cooldown_active?(email, code)
          return render_error(:too_many_requests, "cooldown", "Too many attempts. Try again in a minute.", retryAfter: COOLDOWN_SECONDS)
        end

        unless list.authenticate(params[:password].to_s)
          tries_left = register_failure(email, code)
          return render_error(:unauthorized, "wrong_password", "That password doesn't match this quest.", triesLeft: tries_left)
        end

        clear_failures(email, code)

        user = User.find_by(email: email)
        is_new_user = user.nil?

        if is_new_user
          if profile_params[:display_name].blank? || profile_params[:avatar_emoji].blank?
            return render_error(:unprocessable_entity, "needs_profile", "Set up your player profile to continue.")
          end
          user = create_player(email)
        end

        membership = join_membership(list, user)
        apply_time_zone(user)

        session[:user_id] = user.id

        render json: {
          user: UserResource.new(user).serializable_hash,
          list: list_payload(list, membership),
          isNewUser: is_new_user
        }
      end

      # POST /api/v1/auth/identify
      # Establish identity by email (create or resume a player) WITHOUT joining a quest.
      # Used by the "Start a quest" path before creating a quest. Identity is the email;
      # there is no user password in v1 — the quest password gates quest access, not identity.
      def identify
        email = normalized_email
        return render_error(:bad_request, "param_missing", "Email is required.") if email.blank?

        user = User.find_by(email: email)
        is_new_user = user.nil?

        if is_new_user
          if profile_params[:display_name].blank? || profile_params[:avatar_emoji].blank?
            return render_error(:unprocessable_entity, "needs_profile", "Set up your player profile to continue.")
          end
          user = create_player(email)
        else
          apply_time_zone(user)
        end

        session[:user_id] = user.id
        render json: { user: UserResource.new(user).serializable_hash, isNewUser: is_new_user }
      end

      # DELETE /api/v1/auth/session — sign out.
      def destroy
        reset_session
        head :no_content
      end

      # POST /api/v1/auth/verify — check a quest password without joining.
      def verify
        list = List.find_by(join_code: normalized_code)
        return render_error(:not_found, "code_not_found", "No quest with that code.") unless list

        if list.authenticate(params[:password].to_s)
          render json: { ok: true, list: ListResource.new(list).serializable_hash }
        else
          render_error(:unauthorized, "wrong_password", "That password doesn't match this quest.")
        end
      end

      private

      def normalized_email
        params[:email].to_s.strip.downcase
      end

      def normalized_code
        params[:join_code].to_s.strip.upcase
      end

      def profile_params
        {
          display_name: params[:display_name].to_s.strip,
          avatar_emoji: params[:avatar_emoji].to_s.strip
        }
      end

      def create_player(email)
        user = User.create!(
          email: email,
          display_name: profile_params[:display_name],
          avatar_emoji: profile_params[:avatar_emoji],
          time_zone: params[:time_zone].presence || "UTC",
          xp_total: WELCOME_XP
        )
        user.update!(level: User.level_for_xp(user.xp_total))
        user
      end

      def join_membership(list, user)
        list.memberships.find_or_create_by!(user_id: user.id) do |m|
          m.role = :member
        end.tap do |membership|
          if membership.previously_new_record?
            Activity.create!(list: list, user: user, action: "member.joined", target: membership)
            ListBroadcaster.member_joined(membership, actor: user)
          end
        end
      end

      def apply_time_zone(user)
        tz = params[:time_zone].to_s
        return if tz.blank?
        return unless user.time_zone.blank? || user.time_zone == "UTC"

        user.update(time_zone: tz)
      end

      def list_payload(list, membership)
        ListResource.new(list).serializable_hash.merge(
          membership: { role: membership.role, xpInList: membership.xp_in_list }
        )
      end

      # --- brute-force guard (failure counter in cache, per email+code) ---

      def failure_key(email, code)
        "auth_fail:#{email}:#{code}"
      end

      def cooldown_active?(email, code)
        Rails.cache.read(failure_key(email, code)).to_i >= FAILURE_LIMIT
      end

      def register_failure(email, code)
        key = failure_key(email, code)
        count = Rails.cache.read(key).to_i + 1
        Rails.cache.write(key, count, expires_in: COOLDOWN_SECONDS)
        [ FAILURE_LIMIT - count, 0 ].max
      end

      def clear_failures(email, code)
        Rails.cache.delete(failure_key(email, code))
      end
    end
  end
end
