# Compact user for nesting (assignee avatars, activity actors).
class MiniUserResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :display_name, :avatar_emoji, :level
end
