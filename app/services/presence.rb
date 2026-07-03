# In-memory, refcounted presence per quest. Single-process (fine for v1); a Redis
# set keyed "list:<id>:online" would be the multi-process answer (see Decision B).
class Presence
  MUTEX = Mutex.new
  # list_id => { user_id => { count:, user: {mini} } }
  STATE = Hash.new { |hash, key| hash[key] = {} }

  class << self
    def join(list_id, user)
      MUTEX.synchronize do
        entry = STATE[list_id][user.id] ||= { count: 0, user: mini(user) }
        entry[:count] += 1
      end
      broadcast(list_id)
    end

    def leave(list_id, user_id)
      changed = MUTEX.synchronize do
        entry = STATE[list_id][user_id]
        next false unless entry

        entry[:count] -= 1
        STATE[list_id].delete(user_id) if entry[:count] <= 0
        true
      end
      broadcast(list_id) if changed
    end

    def touch(_list_id, _user)
      # No-op for the in-memory store; hook for a TTL-based implementation.
    end

    def online(list_id)
      MUTEX.synchronize { STATE[list_id].values.map { |entry| entry[:user] } }
    end

    def reset!
      MUTEX.synchronize { STATE.clear }
    end

    private

    def broadcast(list_id)
      ActionCable.server.broadcast("list:#{list_id}", { type: "presence", payload: { online: online(list_id) } })
    end

    def mini(user)
      { id: user.id, displayName: user.display_name, avatarEmoji: user.avatar_emoji, level: user.level }
    end
  end
end
