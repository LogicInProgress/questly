require "test_helper"

class ManagementTest < ActionDispatch::IntegrationTest
  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @member = User.create!(email: "member@mail.com", display_name: "Mem", avatar_emoji: "🐼")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
    @list.memberships.create!(user: @member, role: :member)
  end

  def sign_in(user)
    post "/api/v1/auth/identify", params: { email: user.email }, as: :json
  end

  def code = @list.join_code

  test "host renames the quest" do
    sign_in(@host)
    patch "/api/v1/lists/#{code}", params: { name: "Spiti Valley", emblem_emoji: "🏕️" }, as: :json
    assert_response :success
    assert_equal "Spiti Valley", @list.reload.name
  end

  test "host changes the password" do
    sign_in(@host)
    patch "/api/v1/lists/#{code}", params: { password: "newpass" }, as: :json
    assert_response :success
    assert @list.reload.authenticate("newpass")
    assert_not @list.authenticate("trek")
  end

  test "blank password keeps the current one" do
    sign_in(@host)
    patch "/api/v1/lists/#{code}", params: { name: "Renamed", password: "" }, as: :json
    assert_response :success
    assert @list.reload.authenticate("trek")
  end

  test "non-host cannot update or delete" do
    sign_in(@member)
    patch "/api/v1/lists/#{code}", params: { name: "Nope" }, as: :json
    assert_response :forbidden
    delete "/api/v1/lists/#{code}"
    assert_response :forbidden
  end

  test "host deletes the quest" do
    sign_in(@host)
    assert_difference -> { List.count }, -1 do
      delete "/api/v1/lists/#{code}"
    end
    assert_response :no_content
  end

  test "member leaves; host cannot leave" do
    sign_in(@member)
    assert_difference -> { @list.memberships.count }, -1 do
      delete "/api/v1/lists/#{code}/leave"
    end
    assert_response :no_content

    sign_in(@host)
    delete "/api/v1/lists/#{code}/leave"
    assert_response :forbidden
  end

  test "host removes a member; cannot remove the host" do
    sign_in(@host)
    assert_difference -> { @list.memberships.count }, -1 do
      delete "/api/v1/lists/#{code}/members/#{@member.id}"
    end
    assert_response :no_content

    delete "/api/v1/lists/#{code}/members/#{@host.id}"
    assert_response :forbidden
  end

  test "updates own profile" do
    sign_in(@member)
    patch "/api/v1/me", params: { display_name: "Neha", avatar_emoji: "🦉" }, as: :json
    assert_response :success
    assert_equal "Neha", @member.reload.display_name
    assert_equal "🦉", @member.avatar_emoji
  end
end
