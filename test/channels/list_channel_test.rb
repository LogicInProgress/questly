require "test_helper"

class ListChannelTest < ActionCable::Channel::TestCase
  setup do
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
    Presence.reset!
  end

  test "a member subscribes and streams from the list" do
    stub_connection current_user: @host
    subscribe list_code: @list.join_code
    assert subscription.confirmed?
    assert_has_stream "list:#{@list.id}"
  end

  test "a non-member is rejected" do
    stranger = User.create!(email: "s@mail.com", display_name: "S", avatar_emoji: "🐢")
    stub_connection current_user: stranger
    subscribe list_code: @list.join_code
    assert subscription.rejected?
  end

  test "presence tracks online members" do
    stub_connection current_user: @host
    subscribe list_code: @list.join_code
    assert_equal [ @host.id ], Presence.online(@list.id).map { |u| u[:id] }
  end
end
