require "test_helper"

class DetailTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  # minitest 6 dropped minitest/mock; small class-method override for the preview test.
  def with_link_preview(result)
    original = LinkPreview.method(:fetch)
    LinkPreview.define_singleton_method(:fetch) { |_url| result }
    yield
  ensure
    LinkPreview.define_singleton_method(:fetch, original)
  end

  setup do
    Rails.cache.clear
    @host = User.create!(email: "host@mail.com", display_name: "Host", avatar_emoji: "🦊")
    @list = List.create!(name: "Ladakh", emblem_emoji: "🏔️", password: "trek", creator: @host)
    @list.memberships.create!(user: @host, role: :host)
    @gear = @list.tags.create!(name: "Gear", emoji: "🎒", color: "#8b5cf6")
    @tent = @list.objectives.create!(title: "Buy tent", priority: :high, due_on: Date.tomorrow, creator: @host, position: 0)
    @tent.tags << @gear
    @tent.loot_links.create!(url: "https://decathlon.in/tent", title: "Quechua MH100", kind: :buy, price_cents: 849900)
    @tent.comments.create!(user: @host, body: "go for it")
    # A second open objective so completing @tent doesn't make the quest 100%
    # (which would cascade completionist/quest_master badges into XP totals).
    @list.objectives.create!(title: "Other", priority: :low, creator: @host, position: 1)
    sign_in(@host)
  end

  def sign_in(user)
    post "/api/v1/auth/identify", params: { email: user.email }, as: :json
    assert_response :success
  end

  test "objective detail includes loot links, tags, comments" do
    get "/api/v1/objectives/#{@tent.id}"
    assert_response :success
    obj = response.parsed_body["objective"]
    assert_equal "Buy tent", obj["title"]
    assert_equal [ "Gear" ], obj["tags"].map { |t| t["name"] }
    assert_equal "Quechua MH100", obj["lootLinks"].first["title"]
    assert_equal "go for it", obj["comments"].first["body"]
    assert_equal "Host", obj["comments"].first.dig("user", "displayName")
  end

  test "complete awards XP to user and membership" do
    assert_equal 0, @host.xp_total
    post "/api/v1/objectives/#{@tent.id}/complete"
    assert_response :success
    body = response.parsed_body
    assert_equal 30, body["xpAwarded"] # base 10 + high 10 + on-time 10
    assert_equal "done", body.dig("objective", "status")
    assert_equal @host.id, body.dig("objective", "completer", "id")
    assert_includes body["newAchievements"].map { |a| a["code"] }, "first_blood"

    # 30 completion + 25 first_blood reward (quest not 100%, so no cascade).
    assert_equal 55, @host.reload.xp_total
    assert_equal 30, @list.memberships.find_by(user: @host).xp_in_list # badges don't touch per-quest XP
  end

  test "complete twice is rejected" do
    post "/api/v1/objectives/#{@tent.id}/complete"
    post "/api/v1/objectives/#{@tent.id}/complete"
    assert_response :unprocessable_entity
    assert_equal "already_done", response.parsed_body.dig("error", "code")
  end

  test "reopen reverts status without clawing back XP" do
    post "/api/v1/objectives/#{@tent.id}/complete"
    xp_after_complete = @host.reload.xp_total
    post "/api/v1/objectives/#{@tent.id}/reopen"
    assert_response :success
    assert_equal "open", response.parsed_body.dig("objective", "status")
    assert_equal xp_after_complete, @host.reload.xp_total # not clawed back
  end

  test "creating a loot link without title enqueues the fetch job" do
    assert_enqueued_with(job: LootLinkFetchJob) do
      post "/api/v1/objectives/#{@tent.id}/loot_links", params: { url: "https://example.com/x", kind: "reference" }, as: :json
    end
    assert_response :created
  end

  test "creating a loot link with a title does not enqueue a job" do
    assert_no_enqueued_jobs only: LootLinkFetchJob do
      post "/api/v1/objectives/#{@tent.id}/loot_links",
           params: { url: "https://example.com/x", title: "Preset", kind: "buy", price_cents: 500 }, as: :json
    end
    assert_response :created
  end

  test "loot link preview endpoint returns parsed fields" do
    stub = LinkPreview::Result.new(title: "Tent", image_url: "https://img/x.png", price_cents: 849900)
    with_link_preview(stub) do
      post "/api/v1/loot_links/preview", params: { url: "https://decathlon.in/tent" }, as: :json
    end
    assert_response :success
    assert_equal "Tent", response.parsed_body["title"]
    assert_equal 849900, response.parsed_body["priceCents"]
  end

  test "comments create, list, and author-only delete" do
    post "/api/v1/objectives/#{@tent.id}/comments", params: { body: "nice" }, as: :json
    assert_response :created
    comment_id = response.parsed_body.dig("comment", "id")

    get "/api/v1/objectives/#{@tent.id}/comments"
    assert_equal 2, response.parsed_body["comments"].size

    # A different member cannot delete someone else's comment.
    other = User.create!(email: "o@mail.com", display_name: "O", avatar_emoji: "🐢")
    @list.memberships.create!(user: other, role: :member)
    sign_in(other)
    delete "/api/v1/comments/#{comment_id}"
    assert_response :forbidden
  end

  test "tags create, update, destroy" do
    post "/api/v1/lists/#{@list.join_code}/tags", params: { name: "Food", emoji: "🍜", color: "#4ade80" }, as: :json
    assert_response :created
    tag_id = response.parsed_body.dig("tag", "id")

    patch "/api/v1/tags/#{tag_id}", params: { name: "Meals" }, as: :json
    assert_equal "Meals", response.parsed_body.dig("tag", "name")

    assert_difference -> { @list.tags.count }, -1 do
      delete "/api/v1/tags/#{tag_id}"
    end
    assert_response :no_content
  end

  test "non-member cannot read objective detail" do
    stranger = User.create!(email: "s@mail.com", display_name: "S", avatar_emoji: "🐙")
    sign_in(stranger)
    get "/api/v1/objectives/#{@tent.id}"
    assert_response :forbidden
  end

  test "link preview parses og tags" do
    html = <<~HTML
      <html><head>
        <meta property="og:title" content="Quechua MH100 3-Person">
        <meta property="og:image" content="/img/tent.png">
        <meta property="og:price:amount" content="8499.00">
        <title>fallback</title>
      </head></html>
    HTML
    result = LinkPreview.new("https://decathlon.in/p/mh100").send(:parse, html, URI("https://decathlon.in/p/mh100"))
    assert_equal "Quechua MH100 3-Person", result.title
    assert_equal "https://decathlon.in/img/tent.png", result.image_url
    assert_equal 849900, result.price_cents
  end
end
