# Achievement engine. Evaluated after each completion (and completion may cascade
# quest-wide badges to every member). Grants are idempotent via the
# user_achievements (user_id, achievement_id) unique index.
module Achievements
  Grant = Struct.new(:user, :achievement, keyword_init: true)

  SPEEDRUN_TARGET = 5
  STREAK_TARGET = 7
  SHARP_TARGET = 10
  TEAM_TARGET = 3
  XP_TARGET = 1000

  module_function

  def evaluate_after_completion(user, objective)
    list = objective.list
    grants = []

    grants << grant(user, "first_blood", list) if completed_count(user) >= 1
    grants << grant(user, "speedrunner", list) if speedrun_count(user) >= SPEEDRUN_TARGET
    grants << grant(user, "streak_7", list) if user.streak_count >= STREAK_TARGET
    grants << grant(user, "sharpshooter", list) if sharp_count(user) >= SHARP_TARGET
    grants << grant(user, "night_owl", list) if night_owl?(objective, user)
    grants << grant(user, "xp_1000", list) if user.xp_total >= XP_TARGET
    grants << grant(user, "team_player", list) if quests_completed_count(user) >= TEAM_TARGET

    if list_complete?(list)
      list.memberships.includes(:user).each { |m| grants << grant(m.user, "completionist", list) }
      host = list.memberships.host.first&.user
      grants << grant(host, "quest_master", list) if host
    end

    grants.compact
  end

  # --- progress helpers (also used by GET /me/achievements) ---

  def completed_count(user)
    Objective.done.where(completed_by_id: user.id).count
  end

  def speedrun_count(user)
    Objective.done.where(completed_by_id: user.id)
             .where("due_on IS NOT NULL AND completed_at::date <= due_on").count
  end

  def sharp_count(user)
    Objective.done.where(completed_by_id: user.id, priority: [ Objective.priorities["high"], Objective.priorities["epic"] ]).count
  end

  def quests_completed_count(user)
    Objective.done.where(completed_by_id: user.id).distinct.count(:list_id)
  end

  def progress_for(user, code)
    case code
    when "first_blood" then [ completed_count(user).clamp(0, 1), 1 ]
    when "speedrunner" then [ speedrun_count(user).clamp(0, SPEEDRUN_TARGET), SPEEDRUN_TARGET ]
    when "streak_7" then [ user.streak_count.clamp(0, STREAK_TARGET), STREAK_TARGET ]
    when "sharpshooter" then [ sharp_count(user).clamp(0, SHARP_TARGET), SHARP_TARGET ]
    when "team_player" then [ quests_completed_count(user).clamp(0, TEAM_TARGET), TEAM_TARGET ]
    when "xp_1000" then [ user.xp_total.clamp(0, XP_TARGET), XP_TARGET ]
    end
  end

  # --- internals ---

  def grant(user, code, list)
    return nil unless user

    achievement = Achievement.find_by(code: code)
    return nil unless achievement

    membership = UserAchievement.new(user: user, achievement: achievement, list: list)
    return nil unless membership.save # false on the uniqueness validation → already earned

    if achievement.xp_reward.positive?
      new_total = user.xp_total + achievement.xp_reward
      user.update!(xp_total: new_total, level: User.level_for_xp(new_total))
    end

    Grant.new(user: user, achievement: achievement)
  end

  def night_owl?(objective, user)
    return false unless objective.completed_at

    objective.completed_at.in_time_zone(user.time_zone).hour < 4
  end

  def list_complete?(list)
    list.objectives.exists? && !list.objectives.where.not(status: Objective.statuses["done"]).exists?
  end
end
