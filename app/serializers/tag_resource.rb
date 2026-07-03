class TagResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :name, :emoji, :color

  # Present only when the query eager-loads a count (see TagsController).
  attribute :objectives_count do |tag|
    tag.respond_to?(:objectives_count) ? tag.objectives_count : nil
  end
end
