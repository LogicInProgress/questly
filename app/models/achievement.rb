class Achievement < ApplicationRecord
  has_many :user_achievements, dependent: :destroy
  has_many :users, through: :user_achievements

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :xp_reward, numericality: { greater_than_or_equal_to: 0 }
end
