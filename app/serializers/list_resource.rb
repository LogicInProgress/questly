# A quest. camelCase keys. Membership/progress are attached by the controller
# when relevant (they depend on the current user).
class ListResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :name, :emblem_emoji, :description, :join_code, :cover_color
end
