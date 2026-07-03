import { useParams } from "react-router-dom"
import { useActivities } from "@/api/quests"
import type { ActivityItem } from "@/api/types"
import { useListChannel } from "@/cable/useListChannel"
import { Avatar } from "@/components/board"
import { OfflineBanner } from "@/components/OfflineBanner"
import { questTabs, TabBar } from "@/components/nav"
import { ScreenHeader, Spinner } from "@/components/ui"
import { timeAgo } from "@/utils/dates"

function phrase(item: ActivityItem): { verb: string; label?: string; suffix?: string } {
  const label = item.target.label ?? undefined
  switch (item.action) {
    case "objective.completed":
      return { verb: "cleared", label, suffix: item.meta.xp ? ` · +${item.meta.xp} XP` : "" }
    case "objective.created":
      return { verb: "added", label }
    case "comment.created":
      return { verb: "commented on", label }
    case "loot_link.created":
      return { verb: "added a loot link", label: undefined }
    case "tag.created":
      return { verb: "created tag", label }
    case "member.joined":
      return { verb: "joined the quest" }
    case "quest.created":
      return { verb: "created the quest" }
    default:
      return { verb: item.action }
  }
}

// S15 — Activity feed (live).
export function ActivityFeed() {
  const { code = "" } = useParams()
  const { data: activities, isLoading } = useActivities(code)
  const { online, connected } = useListChannel(code)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <OfflineBanner connected={connected} />
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ScreenHeader title="Party feed" subtitle="Live · updates as you go" icon="📣" />

        {online.length > 0 && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 px-3 py-1.5 text-xs font-semibold text-[#bbf7d0]">
            🟢 {online.length} online now
          </div>
        )}

        {isLoading ? (
          <Spinner />
        ) : activities && activities.length > 0 ? (
          activities.map((item) => {
            const { verb, label, suffix } = phrase(item)
            return (
              <div key={item.id} className="mb-3.5 flex gap-3">
                <Avatar emoji={item.user.avatarEmoji} size="sm" />
                <div className="text-[13px]">
                  <span className="text-ink">
                    <b>{item.user.displayName}</b> {verb}
                    {label && <> <b>{label}</b></>}
                    {suffix}
                  </span>
                  <div className="mt-0.5 text-[11px] text-faint">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
            )
          })
        ) : (
          <p className="mt-10 text-center text-sm text-faint">No activity yet. Get questing!</p>
        )}
      </div>
      <TabBar items={questTabs(code)} />
    </div>
  )
}
