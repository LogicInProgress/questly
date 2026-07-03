import { useNavigate } from "react-router-dom"
import { useAchievements, useMe } from "@/api/auth"
import type { AchievementCatalogItem } from "@/api/types"
import { XpBar } from "@/components/board"
import { appTabs, TabBar } from "@/components/nav"
import { ScreenHeader, Spinner } from "@/components/ui"
import { useEffect } from "react"

// S14 — Badges / achievements.
export function Badges() {
  const navigate = useNavigate()
  const { data: me, isLoading: meLoading } = useMe()
  const { data, isLoading } = useAchievements()

  useEffect(() => {
    if (!meLoading && !me?.user) navigate("/", { replace: true })
  }, [meLoading, me, navigate])

  if (isLoading || meLoading || !data) return <Spinner />

  // Feature a locked badge with the most progress, to nudge the next unlock.
  const nextUp = data.achievements
    .filter((a) => !a.earned && a.progress)
    .sort((x, y) => y.progress!.current / y.progress!.target - x.progress!.current / x.progress!.target)[0]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ScreenHeader title="Your badges" subtitle={`${data.earnedCount} of ${data.total} earned`} icon="🏅" />

        <div className="mt-2 grid grid-cols-3 gap-4">
          {data.achievements.map((badge) => (
            <BadgeMedal key={badge.id} badge={badge} />
          ))}
        </div>

        {nextUp && (
          <div className="mt-5 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-line bg-bg2 text-xl">
                {nextUp.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold text-ink">{nextUp.name}</div>
                <div className="truncate text-xs text-muted">{nextUp.description}</div>
                <div className="mt-2">
                  <XpBar percent={(nextUp.progress!.current / nextUp.progress!.target) * 100} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <TabBar items={appTabs} />
    </div>
  )
}

function BadgeMedal({ badge }: { badge: AchievementCatalogItem }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div
        className={`grid h-[60px] w-[60px] place-items-center rounded-[20px] text-3xl ${
          badge.earned
            ? "bg-gradient-to-br from-[#ffd873] to-gold shadow-[0_10px_20px_-8px_rgba(255,201,77,.6)]"
            : "bg-surface2 opacity-50 grayscale"
        }`}
      >
        {badge.icon}
      </div>
      <small className="text-[11px] font-semibold text-muted">{badge.name}</small>
    </div>
  )
}
