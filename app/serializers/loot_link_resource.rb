class LootLinkResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :url, :kind, :price_cents, :currency, :image_url, :objective_id

  attribute :title, &:display_title
end
