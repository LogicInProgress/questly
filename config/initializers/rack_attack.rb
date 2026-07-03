# Coarse safety net over the join endpoint. The precise per-email+code "3 failures
# → 60s cooldown" (with tries-left messaging) lives in Api::V1::AuthController;
# this just caps abusive volume per IP.
class Rack::Attack
  throttle("auth/join/ip", limit: 20, period: 60.seconds) do |req|
    req.ip if req.post? && req.path == "/api/v1/auth/join"
  end

  self.throttled_responder = lambda do |_request|
    body = { error: { code: "rate_limited", message: "Too many requests. Slow down a moment." } }.to_json
    [ 429, { "Content-Type" => "application/json" }, [ body ] ]
  end
end

# The controller-level cooldown is what tests exercise; keep this coarse IP throttle
# out of the way in tests.
Rack::Attack.enabled = false if Rails.env.test?
