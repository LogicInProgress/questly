module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    # Authenticate off the same Rails session cookie the REST API uses — no token.
    def find_verified_user
      user_id = session_user_id
      user = user_id && User.find_by(id: user_id)
      user || reject_unauthorized_connection
    end

    def session_user_id
      session = cookies.encrypted[Rails.application.config.session_options[:key]]
      return if session.blank?

      session["user_id"] || session[:user_id]
    end
  end
end
