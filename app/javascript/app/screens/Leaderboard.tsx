import { useParams } from "react-router-dom"
import { useLeaderboard } from "@/api/quests"
import type { LeaderboardRow } from "@/api/types"
import { useListChannel } from "@/cable/useListChannel"
import { Avatar } from "@/components/board"
import { OfflineBanner } from "@/components/OfflineBanner"
import { questTabs, TabBar } from "@/components/nav"
import { ScreenHeader, Spinner } from "@/components/ui"

// S13 — Ranks / leaderboard.
export function Leaderboard() {
  const { code = "" } = useParams()
  const { data: rows, isLoading } = useLeaderboard(code)
  const { connected } = useListChannel(code)

  if (isLoading) return <Spinner />

  const top3 = (rows ?? []).slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardRow[]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <OfflineBanner connected={connected} />
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ScreenHeader title="Quest ranks" subtitle="Who's carrying the party?" icon="🏆" />

        {podiumOrder.length > 0 && (
          <div className="mb-4 mt-1 flex items-end justify-center gap-3.5">
            {podiumOrder.map((row) => {
              const first = row.rank === 1
              return (
                <div key={row.id} className="text-center">
                  <Avatar
                    emoji={row.avatarEmoji}
                    size={first ? "lg" : "md"}
                    className={first ? "!border-gold ring-[3px] ring-gold/40" : ""}
                  />
                  <div className="mt-1 text-xs text-muted">{row.displayName}</div>
                  <div className={`font-display ${first ? "text-lg text-gold" : "text-[#cbd5e1]"}`}>
                    {row.rank}
                    {first ? " 👑" : ""}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {(rows ?? []).map((row) => (
          <div
            key={row.id}
            className={`mb-2.5 flex items-center gap-3 rounded-rs border p-3 ${
              row.rank === 1 ? "border-gold/40 bg-gradient-to-br from-gold/[.18] to-surface" : "border-line bg-surface"
            }`}
          >
            <span className={`w-6 text-center font-display font-bold ${row.rank === 1 ? "text-gold" : "text-ink"}`}>
              {row.rank}
            </span>
            <Avatar emoji={row.avatarEmoji} size="sm" />
            <span className="flex-1 text-sm font-semibold text-ink">
              {row.displayName}
              {row.role === "host" && <span className="ml-1.5 text-[11px] text-violet-2">host</span>}
            </span>
            <span className="font-display text-sm font-semibold text-violet-2">{row.xpInList} XP</span>
          </div>
        ))}

        <p className="mt-4 text-center text-xs text-muted">Resets never — bragging rights are forever.</p>
      </div>
      <TabBar items={questTabs(code)} />
    </div>
  )
}
