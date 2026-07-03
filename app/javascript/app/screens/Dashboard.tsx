import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMe } from "@/api/auth"
import { useQuests } from "@/api/quests"
import type { QuestCardData } from "@/api/types"
import { Avatar, AvatarStack, XpBar } from "@/components/board"
import { appTabs, Fab, TabBar } from "@/components/nav"
import { Button, Spinner } from "@/components/ui"
import { levelProgress } from "@/utils/levels"

// S05 — Dashboard / My quests (with S18 empty state).
export function Dashboard() {
  const navigate = useNavigate()
  const { data: me, isLoading: meLoading } = useMe()
  const { data: quests, isLoading: questsLoading } = useQuests()

  useEffect(() => {
    if (!meLoading && !me?.user) navigate("/", { replace: true })
  }, [meLoading, me, navigate])

  if (meLoading || questsLoading || !me?.user) return <Spinner />

  const user = me.user
  const progress = levelProgress(user.level, user.xpTotal)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Hey {user.displayName} 👋</h1>
            <p className="mt-0.5 text-xs text-muted">
              {quests?.length ?? 0} active {quests?.length === 1 ? "quest" : "quests"}
              {user.streakCount > 0 && <> · 🔥 {user.streakCount}-day streak</>}
            </p>
          </div>
          <Avatar emoji={user.avatarEmoji} />
        </div>

        <div className="rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet to-[#6d3bd6] px-2.5 py-1 font-display text-xs font-semibold text-white">
              ⭐ Level {user.level}
            </span>
            <span className="text-xs text-muted">
              {user.xpTotal.toLocaleString()} / {progress.next.toLocaleString()} XP
            </span>
          </div>
          <XpBar percent={progress.percent} />
        </div>

        {quests && quests.length > 0 ? (
          <>
            <div className="mx-0.5 mb-2.5 mt-4 font-display text-[13px] font-semibold uppercase tracking-wide text-muted">
              Active quests <span className="text-[11px] font-normal text-faint">{quests.length}</span>
            </div>
            {quests.map((q) => (
              <QuestCard key={q.list.id} quest={q} onClick={() => navigate(`/q/${q.list.joinCode}`)} />
            ))}
            <div className="h-24" />
          </>
        ) : (
          <EmptyState onStart={() => navigate("/new")} onJoin={() => navigate("/join")} />
        )}
      </div>

      <TabBar items={appTabs} />
      <Fab onClick={() => navigate("/new")} />
    </div>
  )
}

function QuestCard({ quest, onClick }: { quest: QuestCardData; onClick: () => void }) {
  const { list } = quest
  const { total, done } = list.progress
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 w-full rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-4 text-left transition active:scale-[.99]"
    >
      <div className="flex items-center gap-3">
        <Avatar emoji={list.emblemEmoji} size="md" className="!rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold text-ink">{list.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            {done} / {total} done{quest.role === "host" ? " · host" : ""}
          </div>
        </div>
        <AvatarStack users={list.members} />
      </div>
      <div className="mt-3">
        <XpBar percent={percent} />
      </div>
    </button>
  )
}

// S18 — empty state.
function EmptyState({ onStart, onJoin }: { onStart: () => void; onJoin: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="text-6xl">🗺️</div>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">No quests yet</h2>
      <p className="max-w-[240px] text-sm text-muted">
        Start one for your next trip, or join a friend's with their code.
      </p>
      <div className="mt-3 w-full max-w-[240px] space-y-3">
        <Button onClick={onStart}>Start a quest</Button>
        <Button variant="ghost" onClick={onJoin}>
          Join with a code
        </Button>
      </div>
    </div>
  )
}
