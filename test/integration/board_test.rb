require "test_helper"

class BoardTest < ActionDispatch::IntegrationTest
  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
    @gear = @list.tags.create!(name: "Gear", emoji: "🎒", color: "#8b5cf6")
    @permits = @list.tags.create!(name: "Permits", emoji: "📄", color: "#38bdf8")

    @tent = @list.objectives.create!(title: "Buy tent", priority: :high, due_on: Date.tomorrow, creator: @host, position: 0)
    @tent.tags << @gear
    @permit = @list.objectives.create!(title: "Permits", priority: :low, creator: @host, position: 1)
    @permit.tags << @permits
    @done = @list.objectives.create!(title: "Jackets", priority: :low, status: :done,
                                     completed_by_id: @host.id, completed_at: Time.current, creator: @host, position: 2)

    sign_in(@host)
  end

  def sign_in(user)
    post "/api/v1/auth/identify", params: { email: user.email }, as: :json
    assert_response :success
  end

  def code = @list.join_code

  test "dashboard lists my quests with progress and members" do
    get "/api/v1/lists"
    assert_response :success
    quest = response.parsed_body["lists"].first
    assert_equal({ "total" => 3, "done" => 1 }, quest.dig("list", "progress"))
    assert_equal 1, quest.dig("list", "members").size
  end

  test "quest detail returns progress and role" do
    get "/api/v1/lists/#{code}"
    assert_response :success
    assert_equal "host", response.parsed_body.dig("list", "role")
    assert_equal 3, response.parsed_body.dig("list", "progress", "total")
  end

  test "objectives index returns all with tags, xp, assignee" do
    get "/api/v1/lists/#{code}/objectives"
    assert_response :success
    objectives = response.parsed_body["objectives"]
    assert_equal 3, objectives.size
    tent = objectives.find { |o| o["title"] == "Buy tent" }
    assert_equal 30, tent["potentialXp"] # base 10 + high 10 + on-time 10
    assert_equal [ "Gear" ], tent["tags"].map { |t| t["name"] }
  end

  test "objectives filter by tag, status, due" do
    get "/api/v1/lists/#{code}/objectives", params: { tag: @gear.id }
    assert_equal [ "Buy tent" ], response.parsed_body["objectives"].map { |o| o["title"] }

    get "/api/v1/lists/#{code}/objectives", params: { status: "done" }
    assert_equal [ "Jackets" ], response.parsed_body["objectives"].map { |o| o["title"] }

    get "/api/v1/lists/#{code}/objectives", params: { due: "soon" }
    assert_equal [ "Buy tent" ], response.parsed_body["objectives"].map { |o| o["title"] }
  end

  test "create objective with tags and assignee" do
    assert_difference -> { @list.objectives.count }, 1 do
      post "/api/v1/lists/#{code}/objectives",
           params: { title: "Oxygen cans", priority: "epic", assignee_id: @host.id, tag_ids: [ @gear.id ] },
           as: :json
    end
    assert_response :created
    obj = response.parsed_body["objective"]
    assert_equal "epic", obj["priority"]
    assert_equal @host.id, obj.dig("assignee", "id")
    assert_equal [ "Gear" ], obj["tags"].map { |t| t["name"] }
    assert_equal 35, obj["potentialXp"] # base 10 + epic 25 (no due)
  end

  test "tags index returns objective counts" do
    get "/api/v1/lists/#{code}/tags"
    assert_response :success
    gear = response.parsed_body["tags"].find { |t| t["name"] == "Gear" }
    assert_equal 1, gear["objectivesCount"]
  end

  test "members index returns roster with done counts" do
    get "/api/v1/lists/#{code}/members"
    assert_response :success
    host = response.parsed_body["members"].first
    assert_equal "host", host["role"]
    assert_equal 1, host["doneCount"]
  end

  test "non-member cannot read the board" do
    other = User.create!(email: "other@mail.com", display_name: "Other", avatar_emoji: "🐢")
    sign_in(other)
    get "/api/v1/lists/#{code}/objectives"
    assert_response :forbidden
    assert_equal "not_a_member", response.parsed_body.dig("error", "code")
  end
end
