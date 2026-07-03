require "test_helper"

class AuthFlowTest < ActionDispatch::IntegrationTest
  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @list = List.create!(name: "Leh-Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
  end

  def join(params)
    post "/api/v1/auth/join", params: params, as: :json
  end

  test "returning user joins with correct password" do
    join(email: "host@mail.com", join_code: @list.join_code, password: "trek")
    assert_response :success
    body = response.parsed_body
    assert_equal false, body["isNewUser"]
    assert_equal "host", body.dig("list", "membership", "role")
    assert_equal @host.id, session[:user_id]
  end

  test "new user without profile gets needs_profile, then joins on resubmit" do
    join(email: "new@mail.com", join_code: @list.join_code, password: "trek")
    assert_response :unprocessable_entity
    assert_equal "needs_profile", response.parsed_body.dig("error", "code")
    assert_nil User.find_by(email: "new@mail.com"), "user must not be created before profile is set"

    join(email: "new@mail.com", join_code: @list.join_code, password: "trek",
         display_name: "Neha", avatar_emoji: "🦉")
    assert_response :success
    assert_equal true, response.parsed_body["isNewUser"]
    user = User.find_by(email: "new@mail.com")
    assert_equal 50, user.xp_total, "welcome bonus applied"
    assert @list.members.include?(user)
  end

  test "wrong password returns 401 with decreasing triesLeft" do
    join(email: "host@mail.com", join_code: @list.join_code, password: "nope")
    assert_response :unauthorized
    assert_equal "wrong_password", response.parsed_body.dig("error", "code")
    assert_equal 2, response.parsed_body.dig("error", "triesLeft")

    join(email: "host@mail.com", join_code: @list.join_code, password: "nope")
    assert_equal 1, response.parsed_body.dig("error", "triesLeft")
  end

  test "unknown code returns 404" do
    join(email: "host@mail.com", join_code: "NOPE999", password: "trek")
    assert_response :not_found
    assert_equal "code_not_found", response.parsed_body.dig("error", "code")
  end

  test "cooldown after 3 failures returns 429" do
    3.times { join(email: "host@mail.com", join_code: @list.join_code, password: "nope") }
    join(email: "host@mail.com", join_code: @list.join_code, password: "trek")
    assert_response :too_many_requests
    assert_equal "cooldown", response.parsed_body.dig("error", "code")
    assert_equal 60, response.parsed_body.dig("error", "retryAfter")
  end

  test "identify establishes a session and create quest applies template" do
    post "/api/v1/auth/identify",
         params: { email: "maker@mail.com", display_name: "Maker", avatar_emoji: "🐼" }, as: :json
    assert_response :success
    maker = User.find_by(email: "maker@mail.com")
    assert_equal maker.id, session[:user_id]

    assert_difference -> { List.count } => 1 do
      post "/api/v1/lists",
           params: { name: "Camp", emblem_emoji: "🏕️", password: "pass", template_key: "camping_trip",
                     tags: [ { name: "Extra", emoji: "✨", color: "#ffc94d" } ] },
           as: :json
    end
    assert_response :created
    list = List.find_by(join_code: response.parsed_body.dig("list", "joinCode"))
    assert_equal "host", list.memberships.find_by(user: maker).role
    assert_equal 9, list.objectives.count, "template objectives created"
    assert_includes list.tags.pluck(:name), "Extra"
    assert_includes list.tags.pluck(:name), "Gear"
  end

  test "create quest requires authentication" do
    post "/api/v1/lists", params: { name: "X", emblem_emoji: "🎯", password: "pass" }, as: :json
    assert_response :unauthorized
  end

  test "sign out clears the session" do
    join(email: "host@mail.com", join_code: @list.join_code, password: "trek")
    assert session[:user_id]
    delete "/api/v1/auth/session"
    assert_response :no_content
    get "/api/v1/me"
    assert_response :unauthorized
  end
end
