# One subscription per logged-in user — cross-quest notifications
# (mentions, assignments, due-date reminders).
class UserChannel < ApplicationCable::Channel
  def subscribed
    stream_from "user:#{current_user.id}"
  end
end
