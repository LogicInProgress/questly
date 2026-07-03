class UserAchievement < ApplicationRecord
  belongs_to :user
  belongs_to :achievement
  belongs_to :list, optional: true

  validates :achievement_id, uniqueness: { scope: :user_id }

  before_validation :set_earned_at, on: :create

  private

  def set_earned_at
    self.earned_at ||= Time.current
  end
end
