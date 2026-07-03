# Fills in a loot link's title / OG image / price after creation, without blocking
# the request. Only fills fields the user hasn't already set.
class LootLinkFetchJob < ApplicationJob
  queue_as :default

  def perform(loot_link_id)
    link = LootLink.find_by(id: loot_link_id)
    return unless link

    preview = LinkPreview.fetch(link.url)

    updates = {}
    updates[:title] = preview.title if link.title.blank? && preview.title.present?
    updates[:image_url] = preview.image_url if link.image_url.blank? && preview.image_url.present?
    updates[:price_cents] = preview.price_cents if link.price_cents.nil? && preview.price_cents.present?

    return if updates.empty?

    link.update(updates)
    ListBroadcaster.loot_link_updated(link) if defined?(ListBroadcaster)
  end
end
