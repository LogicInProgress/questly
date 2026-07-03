import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMembers, useQuest, useLeaveQuest, useRemoveMember } from "@/api/quests"
import { useListChannel } from "@/cable/useListChannel"
import { Avatar } from "@/components/board"
import { OfflineBanner } from "@/components/OfflineBanner"
import { questTabs, TabBar } from "@/components/nav"
import { Button, ScreenHeader, Spinner } from "@/components/ui"

// S12 — Party (members, presence, roles, share).
export function Party() {
  const { code = "" } = useParams()
  const navigate = useNavigate()
  const quest = useQuest(code)
  const members = useMembers(code)
  const { online, connected } = useListChannel(code)
  const removeMember = useRemoveMember(code)
  const leaveQuest = useLeaveQuest()

  const [copied, setCopied] = useState(false)

  if (quest.isLoading || members.isLoading || !quest.data) return <Spinner />

  const isHost = quest.data.role === "host"
  const onlineIds = new Set(online.map((u) => u.id))
  const inviteLink = `${window.location.origin}/join`

  const share = async () => {
    const text = `Join my Questly "${quest.data!.name}" — code ${quest.data!.joinCode} at ${inviteLink}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const leave = () => {
    if (!confirm("Leave this quest?")) return
    leaveQuest.mutate(code, { onSuccess: () => navigate("/quests") })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <OfflineBanner connected={connected} />
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ScreenHeader
          title="The party"
          subtitle={`${members.data?.length ?? 0} ${members.data?.length === 1 ? "adventurer" : "adventurers"} · ${online.length} online now`}
          icon="👥"
        />

        {members.data?.map((m) => (
          <div key={m.id} className="mb-2.5 flex items-center gap-3 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3">
            <Avatar emoji={m.avatarEmoji} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {m.displayName}
                {m.role === "host" && (
                  <span className="rounded-full border border-violet/30 bg-violet/15 px-2 py-0.5 text-[11px] text-violet-2">host</span>
                )}
              </div>
              <div className="text-xs text-muted">
                {onlineIds.has(m.id) ? "🟢 online" : "⚪ offline"} · {m.doneCount} done
              </div>
            </div>
            <span className="rounded-full bg-gradient-to-br from-violet to-[#6d3bd6] px-2.5 py-1 font-display text-xs font-semibold text-white">
              Lv {m.level}
            </span>
            {isHost && m.role !== "host" && (
              <button
                type="button"
                aria-label={`Remove ${m.displayName}`}
                onClick={() => confirm(`Remove ${m.displayName}?`) && removeMember.mutate(m.id)}
                className="text-sm text-faint hover:text-coral"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <Button variant="ghost" className="mt-2" onClick={share}>
          {copied ? "✓ Copied invite" : "🔗 Share code & invite link"}
        </Button>

        <div className="mt-3 rounded-r border border-dashed border-line p-3 text-center">
          <div className="text-xs text-muted">Quest code</div>
          <div className="mt-0.5 font-display text-lg tracking-[2px] text-ink">{quest.data.joinCode}</div>
          <div className="mt-1 text-xs text-faint">Share the code + password with your party</div>
        </div>

        {!isHost && (
          <Button variant="danger" className="mt-4" onClick={leave} disabled={leaveQuest.isPending}>
            Leave quest
          </Button>
        )}
      </div>
      <TabBar items={questTabs(code)} />
    </div>
  )
}
