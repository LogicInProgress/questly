class Membership < ApplicationRecord
  belongs_to :list
  belongs_to :user

  enum :role, { member: 0, host: 1 }

  validates :user_id, uniqueness: { scope: :list_id }
  validates :xp_in_list, numericality: { greater_than_or_equal_to: 0 }

  before_validation :set_joined_at, on: :create

  private

  def set_joined_at
    self.joined_at ||= Time.current
  end
end
