# Broadcasts quest events to "list:<id>" with the envelope
# { type, payload, actor: {id, name, avatar} }.
class ListBroadcaster
  class << self
    def objective_created(objective, actor:)
      emit(objective.list_id, "objective.created", objective_payload(objective), actor)
    end

    def objective_updated(objective, actor:)
      emit(objective.list_id, "objective.updated", objective_payload(objective), actor)
    end

    def objective_completed(objective, actor:, xp:, membership:)
      payload = objective_payload(objective).merge(
        xpAwarded: xp,
        leaderboardRow: membership && { userId: membership.user_id, xpInList: membership.xp_in_list }
      )
      emit(objective.list_id, "objective.completed", payload, actor)
    end

    def objective_reopened(objective, actor:)
      emit(objective.list_id, "objective.reopened", objective_payload(objective), actor)
    end

    def objective_deleted(list_id, id, actor:)
      emit(list_id, "objective.deleted", { id: id }, actor)
    end

    def loot_link_created(link, actor:)
      emit(link.objective.list_id, "loot_link.created", LootLinkResource.new(link).serializable_hash, actor)
    end

    def loot_link_updated(link)
      emit(link.objective.list_id, "loot_link.updated", LootLinkResource.new(link).serializable_hash, nil)
    end

    def tag_created(tag, actor:)
      emit(tag.list_id, "tag.created", TagResource.new(tag).serializable_hash, actor)
    end

    def comment_created(comment, actor:)
      emit(comment.objective.list_id, "comment.created", CommentResource.new(comment).serializable_hash, actor)
    end

    def member_joined(membership, actor:)
      payload = MiniUserResource.new(membership.user).serializable_hash.merge(role: membership.role)
      emit(membership.list_id, "member.joined", payload, actor)
    end

    def member_xp_changed(list_id, user_id, xp_in_list, level)
      emit(list_id, "member.xp_changed", { userId: user_id, xpInList: xp_in_list, level: level }, nil)
    end

    def member_left(list_id, user_id)
      emit(list_id, "member.left", { userId: user_id }, nil)
    end

    def list_updated(list)
      emit(list.id, "list.updated", ListResource.new(list).serializable_hash, nil)
    end

    def achievement_earned(list_id, user, achievement)
      payload = { userId: user.id, achievement: AchievementResource.new(achievement).serializable_hash }
      emit(list_id, "achievement.earned", payload, user)
    end

    private

    def objective_payload(objective)
      ObjectiveResource.new(objective).serializable_hash
    end

    def emit(list_id, type, payload, actor)
      ActionCable.server.broadcast("list:#{list_id}", { type: type, payload: payload, actor: actor_hash(actor) })
    end

    def actor_hash(user)
      return nil unless user

      { id: user.id, name: user.display_name, avatar: user.avatar_emoji }
    end
  end
end
