class Objective < ApplicationRecord
  belongs_to :list
  belongs_to :creator, class_name: "User", foreign_key: :created_by_id
  belongs_to :assignee, class_name: "User", optional: true, inverse_of: :assigned_objectives
  belongs_to :completer, class_name: "User", foreign_key: :completed_by_id, optional: true

  has_many :loot_links, dependent: :destroy
  has_many :objective_tags, dependent: :destroy
  has_many :tags, through: :objective_tags
  has_many :comments, dependent: :destroy

  enum :priority, { low: 0, high: 1, epic: 2 }
  enum :status, { open: 0, done: 1 }

  validates :title, presence: true, length: { in: 1..140 }

  scope :ordered, -> { order(:position, :created_at) }
  scope :due_soon, -> { where(status: :open).where.not(due_on: nil).where(due_on: ..7.days.from_now.to_date) }

  def completed_on_time?
    due_on.present? && completed_at.present? && completed_at.to_date <= due_on
  end
end
