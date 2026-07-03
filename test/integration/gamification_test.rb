require "test_helper"

class GamificationTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Testing::TimeHelpers

  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊", time_zone: "UTC")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
  end

  # Completes an objective the way the controller does, then awards.
  def award(objective, user, at: Time.current)
    objective.update!(status: :done, completer: user, completed_at: at)
    Gamification.award_completion(objective, user)
  end

  def obj(**attrs)
    @list.objectives.create!(title: "O#{rand(10_000)}", creator: @host, position: 0, **attrs)
  end

  test "first completion grants first_blood and awards XP" do
    obj # a second, still-open objective so the quest isn't 100% complete
    award = award(obj(priority: :high), @host)
    assert_includes award.grants.map { |g| g.achievement.code }, "first_blood"
    # 20 (high completion) + 25 (first_blood reward)
    assert_equal 45, @host.reload.xp_total
  end

  test "streak advances on consecutive days and resets after a gap" do
    travel_to Time.utc(2026, 7, 4, 12) do
      award(obj, @host)
      assert_equal 1, @host.reload.streak_count
    end
    travel_to Time.utc(2026, 7, 5, 12) do
      award(obj, @host)
      assert_equal 2, @host.reload.streak_count
    end
    travel_to Time.utc(2026, 7, 5, 20) do # same day again — no change
      award(obj, @host)
      assert_equal 2, @host.reload.streak_count
    end
    travel_to Time.utc(2026, 7, 10, 12) do # gap → reset
      award(obj, @host)
      assert_equal 1, @host.reload.streak_count
    end
  end

  test "streak_7 badge at seven days" do
    @host.update!(streak_count: 6, last_active_on: Date.new(2026, 7, 4))
    travel_to Time.utc(2026, 7, 5, 12) do
      award = award(obj, @host)
      assert_equal 7, @host.reload.streak_count
      assert_includes award.grants.map { |g| g.achievement.code }, "streak_7"
    end
  end

  test "night_owl for a small-hours completion" do
    travel_to Time.utc(2026, 7, 5, 2) do
      award = award(obj, @host, at: Time.current)
      assert_includes award.grants.map { |g| g.achievement.code }, "night_owl"
    end
  end

  test "sharpshooter after ten high/epic completions" do
    9.times { obj(priority: :high).update!(status: :done, completer: @host, completed_at: Time.current) }
    award = award(obj(priority: :epic), @host)
    assert_includes award.grants.map { |g| g.achievement.code }, "sharpshooter"
  end

  test "completionist for members and quest_master for host on 100%" do
    member = User.create!(email: "m@mail.com", display_name: "M", avatar_emoji: "🐼")
    @list.memberships.create!(user: member, role: :member)
    o1 = obj
    o2 = obj
    o1.update!(status: :done, completer: @host, completed_at: Time.current)
    award = award(o2, member) # now 100% complete
    codes = award.grants.map { |g| [ g.user.id, g.achievement.code ] }
    assert_includes codes, [ @host.id, "completionist" ]
    assert_includes codes, [ member.id, "completionist" ]
    assert_includes codes, [ @host.id, "quest_master" ]
  end

  test "xp_1000 when lifetime XP crosses 1000" do
    @host.update!(xp_total: 990)
    award = award(obj(priority: :high), @host)
    assert_includes award.grants.map { |g| g.achievement.code }, "xp_1000"
  end

  test "team_player after completing in three quests" do
    3.times do |i|
      list = List.create!(name: "Q#{i}", emblem_emoji: "🎯", password: "pass", creator: @host)
      list.memberships.create!(user: @host, role: :host)
      o = list.objectives.create!(title: "t", creator: @host, position: 0)
      o.update!(status: :done, completer: @host, completed_at: Time.current)
    end
    # evaluate on the third quest's objective
    last = Objective.done.where(completed_by_id: @host.id).last
    grants = Achievements.evaluate_after_completion(@host, last)
    assert_includes grants.map { |g| g.achievement.code }, "team_player"
  end

  test "grants are idempotent" do
    award(obj, @host)
    second = award(obj, @host)
    assert_not_includes second.grants.map { |g| g.achievement.code }, "first_blood"
  end

  # --- endpoints ---

  test "complete endpoint returns newAchievements" do
    post "/api/v1/auth/identify", params: { email: @host.email }, as: :json
    target = obj(priority: :high)
    post "/api/v1/objectives/#{target.id}/complete"
    assert_response :success
    assert_includes response.parsed_body["newAchievements"].map { |a| a["code"] }, "first_blood"
  end

  test "leaderboard ranks members by xp_in_list" do
    member = User.create!(email: "m@mail.com", display_name: "M", avatar_emoji: "🐼")
    @list.memberships.create!(user: member, role: :member, xp_in_list: 500)
    @list.memberships.find_by(user: @host).update!(xp_in_list: 200)
    post "/api/v1/auth/identify", params: { email: @host.email }, as: :json

    get "/api/v1/lists/#{@list.join_code}/leaderboard"
    assert_response :success
    rows = response.parsed_body["leaderboard"]
    assert_equal [ 1, 2 ], rows.map { |r| r["rank"] }
    assert_equal member.id, rows.first["id"]
    assert_equal 500, rows.first["xpInList"]
  end

  test "me achievements returns catalog with earned flags and progress" do
    post "/api/v1/auth/identify", params: { email: @host.email }, as: :json
    award(obj, @host) # earns first_blood

    get "/api/v1/me/achievements"
    assert_response :success
    body = response.parsed_body
    assert_equal 9, body["total"]
    first_blood = body["achievements"].find { |a| a["code"] == "first_blood" }
    assert first_blood["earned"]
    sharpshooter = body["achievements"].find { |a| a["code"] == "sharpshooter" }
    assert_equal 10, sharpshooter.dig("progress", "target")
  end
end
