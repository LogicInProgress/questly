# Authoritative gamification rules (XP, levels). Kept server-side so REST and socket
# payloads stay consistent. Completion/streak/achievement logic is layered on in Phase 7.
module Gamification
  XP_BASE = 10
  PRIORITY_BONUS = { "low" => 0, "high" => 10, "epic" => 25 }.freeze
  ON_TIME_BONUS = 10

  module_function

  # XP awarded for completing this objective, given when it was completed.
  def xp_for(objective, completed_at: Time.current)
    on_time = objective.due_on.present? && completed_at.to_date <= objective.due_on
    XP_BASE + PRIORITY_BONUS.fetch(objective.priority, 0) + (on_time ? ON_TIME_BONUS : 0)
  end

  # XP the card advertises before completion (assumes on-time if it has a due date).
  def potential_xp(objective)
    XP_BASE + PRIORITY_BONUS.fetch(objective.priority, 0) + (objective.due_on.present? ? ON_TIME_BONUS : 0)
  end

  Award = Struct.new(:xp, :level, :leveled_up, :xp_in_list, :grants, keyword_init: true)

  # Award XP for a just-completed objective to the user (lifetime) and their
  # membership (per-quest), advance the streak, then evaluate achievements.
  # Reopening does not claw back XP in v1.
  def award_completion(objective, user)
    completed_at = objective.completed_at || Time.current
    xp = xp_for(objective, completed_at: completed_at)
    previous_level = user.level

    user.xp_total += xp
    advance_streak(user, completed_at)
    user.level = User.level_for_xp(user.xp_total)
    user.save!

    membership = objective.list.memberships.find_by(user_id: user.id)
    membership&.increment!(:xp_in_list, xp)

    grants = Achievements.evaluate_after_completion(user, objective)
    user.reload # badge rewards may have added XP / bumped level

    Award.new(
      xp: xp,
      level: user.level,
      leveled_up: user.level > previous_level,
      xp_in_list: membership&.reload&.xp_in_list,
      grants: grants
    )
  end

  # Consecutive-day streak in the user's timezone (spec §streaks).
  def advance_streak(user, completed_at)
    today = completed_at.in_time_zone(user.time_zone).to_date
    user.streak_count =
      if user.last_active_on == today
        [ user.streak_count, 1 ].max
      elsif user.last_active_on == today - 1
        user.streak_count + 1
      else
        1
      end
    user.last_active_on = today
  end
end
