require "test_helper"

class RealtimeTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
    @tent = @list.objectives.create!(title: "Buy tent", priority: :high, creator: @host, position: 0)
    post "/api/v1/auth/identify", params: { email: @host.email }, as: :json
  end

  def stream
    "list:#{@list.id}"
  end

  test "creating an objective broadcasts objective.created" do
    assert_broadcasts(stream, 1) do
      post "/api/v1/lists/#{@list.join_code}/objectives", params: { title: "Oxygen" }, as: :json
    end
  end

  test "completing broadcasts completed + xp change" do
    messages = capture_broadcasts(stream) do
      post "/api/v1/objectives/#{@tent.id}/complete"
    end
    types = messages.map { |m| m["type"] }
    assert_includes types, "objective.completed"
    assert_includes types, "member.xp_changed"
  end

  test "commenting broadcasts comment.created" do
    assert_broadcasts(stream, 1) do
      post "/api/v1/objectives/#{@tent.id}/comments", params: { body: "hi" }, as: :json
    end
  end

  test "activities feed lists recent actions" do
    post "/api/v1/objectives/#{@tent.id}/complete"
    get "/api/v1/lists/#{@list.join_code}/activities"
    assert_response :success
    actions = response.parsed_body["activities"].map { |a| a["action"] }
    assert_includes actions, "objective.completed"
    completed = response.parsed_body["activities"].find { |a| a["action"] == "objective.completed" }
    assert_equal "Buy tent", completed.dig("target", "label")
    assert_equal "Host", completed.dig("user", "displayName")
  end
end
