class Activity < ApplicationRecord
  belongs_to :list
  belongs_to :user
  belongs_to :target, polymorphic: true, optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }

  # Human label for the feed (target may be gone for delete events).
  def target_label
    case target
    when Objective then target.title
    when Tag then target.name
    when Comment then target.objective&.title
    when List then target.name
    when Achievement then target.name
    end
  rescue ActiveRecord::RecordNotFound
    nil
  end
end
