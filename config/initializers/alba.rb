# Alba is the JSON serializer. Use ActiveSupport's inflector so `transform_keys :lower_camel`
# produces camelCase keys (the API response convention).
require "alba"

Alba.inflector = :active_support
