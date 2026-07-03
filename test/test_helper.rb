ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

# The achievements catalog is static seed data the gamification engine depends on.
# db:test:prepare loads schema but not seeds, so seed it here (idempotent).
def seed_catalog!
  load Rails.root.join("db/seeds.rb")
end

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)
    parallelize_setup { |_worker| seed_catalog! }

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

# Single-process runs (below the parallelize threshold) don't fire parallelize_setup.
seed_catalog!
