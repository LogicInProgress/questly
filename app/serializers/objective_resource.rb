class ObjectiveResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :list_id, :title, :description, :emoji, :due_on, :priority, :status, :position, :completed_at

  attribute :potential_xp do |obj|
    Gamification.potential_xp(obj)
  end

  attribute :awarded_xp do |obj|
    obj.done? ? Gamification.xp_for(obj, completed_at: obj.completed_at || Time.current) : nil
  end

  association :assignee, resource: MiniUserResource
  association :completer, resource: MiniUserResource
  association :tags, resource: TagResource
  association :loot_links, resource: LootLinkResource
end
