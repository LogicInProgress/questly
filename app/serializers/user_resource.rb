# Public player profile. camelCase keys via transform_keys.
class UserResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :email, :display_name, :avatar_emoji, :xp_total, :level, :streak_count

  attribute :level_title, &:level_title
end
