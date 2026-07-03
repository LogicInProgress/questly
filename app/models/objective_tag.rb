class ObjectiveTag < ApplicationRecord
  belongs_to :objective
  belongs_to :tag

  validates :objective_id, uniqueness: { scope: :tag_id }
  validate :same_list

  private

  # A tag can only be applied to objectives in its own quest.
  def same_list
    return if objective.nil? || tag.nil?

    errors.add(:tag, "must belong to the same quest") if objective.list_id != tag.list_id
  end
end
