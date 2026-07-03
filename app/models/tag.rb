class Tag < ApplicationRecord
  belongs_to :list

  has_many :objective_tags, dependent: :destroy
  has_many :objectives, through: :objective_tags

  validates :name, presence: true, uniqueness: { scope: :list_id, case_sensitive: false }
end
