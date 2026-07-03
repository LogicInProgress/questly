class ActivityResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :action, :created_at, :meta

  association :user, resource: MiniUserResource

  attribute :target do |activity|
    { type: activity.target_type, id: activity.target_id, label: activity.target_label }
  end
end
