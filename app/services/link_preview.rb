require "net/http"
require "resolv"
require "ipaddr"

# Best-effort fetch of a URL's title / OG image / price for loot-link previews.
# Hardened: http(s) only, redirect cap, timeout, body-size cap, and a basic SSRF
# guard that rejects private/loopback/link-local hosts.
class LinkPreview
  MAX_REDIRECTS = 3
  TIMEOUT = 5
  MAX_BYTES = 512 * 1024

  Result = Struct.new(:title, :image_url, :price_cents, keyword_init: true)

  def self.fetch(url)
    new(url).fetch
  end

  def initialize(url)
    @url = url.to_s.strip
  end

  def fetch
    body, final_uri = get(@url, MAX_REDIRECTS)
    return fallback if body.nil?

    parse(body, final_uri)
  rescue StandardError => e
    Rails.logger.warn("LinkPreview failed for #{@url}: #{e.class}: #{e.message}")
    fallback
  end

  private

  def fallback
    Result.new(title: host_of(@url), image_url: nil, price_cents: nil)
  end

  def get(url, redirects_left)
    uri = URI.parse(url)
    return [ nil, nil ] unless uri.is_a?(URI::HTTP) && uri.host.present?

    ensure_public!(uri)

    body = nil
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: TIMEOUT, read_timeout: TIMEOUT) do |http|
      request = Net::HTTP::Get.new(uri, "User-Agent" => "QuestlyBot/1.0 (+link-preview)")
      http.request(request) do |response|
        case response
        when Net::HTTPRedirection
          location = response["location"]
          return [ nil, nil ] if location.blank? || redirects_left <= 0

          return get(URI.join(uri, location).to_s, redirects_left - 1)
        when Net::HTTPSuccess
          body = read_capped(response)
        else
          return [ nil, nil ]
        end
      end
    end

    [ body, uri ]
  end

  def read_capped(response)
    buffer = +""
    response.read_body do |chunk|
      buffer << chunk
      break if buffer.bytesize >= MAX_BYTES
    end
    buffer
  end

  def ensure_public!(uri)
    addresses = Resolv.getaddresses(uri.host)
    raise "unresolvable host" if addresses.empty?

    addresses.each do |addr|
      ip = IPAddr.new(addr)
      raise "blocked host" if ip.loopback? || ip.private? || ip.link_local?
    end
  end

  def parse(html, uri)
    doc = Nokogiri::HTML(html)
    Result.new(
      title: (meta(doc, "og:title") || doc.at_css("title")&.text&.strip).presence || host_of(uri.to_s),
      image_url: absolutize(meta(doc, "og:image"), uri),
      price_cents: price_from(doc)
    )
  end

  def meta(doc, property)
    node = doc.at_css(%(meta[property="#{property}"])) || doc.at_css(%(meta[name="#{property}"]))
    node&.[]("content")&.strip.presence
  end

  def price_from(doc)
    raw = meta(doc, "og:price:amount") || meta(doc, "product:price:amount") || jsonld_price(doc)
    return nil if raw.blank?

    amount = raw.to_s.gsub(/[^\d.]/, "").to_f
    amount.positive? ? (amount * 100).round : nil
  end

  def jsonld_price(doc)
    doc.css('script[type="application/ld+json"]').each do |node|
      data = JSON.parse(node.text) rescue nil
      next unless data

      Array(data).each do |entry|
        offers = entry.is_a?(Hash) ? entry["offers"] : nil
        price = offers.is_a?(Hash) ? offers["price"] : (offers.is_a?(Array) ? offers.first&.dig("price") : nil)
        return price if price.present?
      end
    end
    nil
  end

  def absolutize(src, uri)
    return nil if src.blank?

    URI.join(uri, src).to_s
  rescue StandardError
    src
  end

  def host_of(url)
    URI.parse(url).host&.sub(/\Awww\./, "") || url
  rescue URI::InvalidURIError
    url
  end
end
