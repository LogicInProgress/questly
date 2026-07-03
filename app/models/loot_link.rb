class LootLink < ApplicationRecord
  belongs_to :objective

  enum :kind, { buy: 0, reference: 1 }

  validates :url, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Falls back to the URL host when no title has been fetched yet.
  def display_title
    return title if title.present?

    URI.parse(url).host&.sub(/\Awww\./, "") || url
  rescue URI::InvalidURIError
    url
  end
end
