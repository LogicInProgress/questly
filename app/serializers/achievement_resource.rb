class AchievementResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :code, :name, :description, :icon, :xp_reward
end
