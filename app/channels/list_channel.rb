# One subscription per open quest. Membership is verified in `subscribed`.
class ListChannel < ApplicationCable::Channel
  def subscribed
    list = List.find_by(join_code: params[:list_code].to_s.strip.upcase)
    membership = list && list.memberships.find_by(user_id: current_user.id)

    return reject unless membership

    @list = list
    stream_from "list:#{list.id}"
    Presence.join(list.id, current_user)
    # Guarantee the just-subscribed client gets the current online set (the broadcast
    # above can race with stream registration on a fresh subscribe).
    transmit({ "type" => "presence", "payload" => { "online" => Presence.online(list.id) } })
  end

  def unsubscribed
    return unless @list

    Presence.leave(@list.id, current_user.id)
  end

  # Client heartbeat to keep presence fresh.
  def ping
    Presence.touch(@list.id, current_user) if @list
  end
end
