class User < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :lists, through: :memberships
  has_many :created_lists, class_name: "List", foreign_key: :created_by_id, dependent: :nullify, inverse_of: :creator
  has_many :assigned_objectives, class_name: "Objective", foreign_key: :assignee_id, dependent: :nullify, inverse_of: :assignee
  has_many :comments, dependent: :destroy
  has_many :user_achievements, dependent: :destroy
  has_many :achievements, through: :user_achievements
  has_many :activities, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :display_name, presence: true, length: { maximum: 40 }
  validates :avatar_emoji, presence: true
  validates :xp_total, :streak_count, numericality: { greater_than_or_equal_to: 0 }
  validates :level, numericality: { greater_than_or_equal_to: 1 }

  normalizes :email, with: ->(e) { e.strip.downcase }

  # XP threshold to reach level n = 50 * n * (n - 1)  (L1:0, L2:100, L3:300, …).
  def self.xp_threshold(level)
    50 * level * (level - 1)
  end

  # Highest level whose threshold is satisfied by the given lifetime XP.
  def self.level_for_xp(xp)
    level = 1
    level += 1 while xp_threshold(level + 1) <= xp
    level
  end

  # Title band for the current level (see Gamification rules).
  def level_title
    case level
    when 1..2 then "Novice"
    when 3..4 then "Pathfinder"
    when 5..6 then "Trailblazer"
    when 7..9 then "Pathmaster"
    else "Quest Master"
    end
  end
end
