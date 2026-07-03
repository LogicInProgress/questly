import { useNavigate } from "react-router-dom"
import { useMe } from "@/api/auth"
import { Button, Spinner } from "@/components/ui"

// S01 — Splash / welcome.
export function Splash() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useMe()

  if (isLoading) return <Spinner />

  const isSignedIn = Boolean(me?.user)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br from-violet to-[#6d3bd6] text-5xl shadow-card">
        ⚔️
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Questly</h1>
        <p className="mx-auto mt-2 max-w-[240px] text-sm text-muted">
          Turn your trip checklist into a co-op quest. Split the loot, race the party.
        </p>
      </div>

      <div className="mt-2 w-full space-y-3">
        {isSignedIn ? (
          <Button onClick={() => navigate("/quests")}>Continue to your quests</Button>
        ) : (
          <>
            <Button onClick={() => navigate("/onboarding")}>Start a quest</Button>
            <Button variant="ghost" onClick={() => navigate("/join")}>
              Join with a code
            </Button>
          </>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center">
        {["🦊", "🐼", "🦉"].map((e, i) => (
          <div
            key={e}
            className="grid h-7 w-7 place-items-center rounded-[9px] border border-line bg-gradient-to-br from-surface3 to-surface2 text-sm"
            style={{ marginLeft: i === 0 ? 0 : -9 }}
          >
            {e}
          </div>
        ))}
        <span className="ml-2 text-xs text-muted">Your party is waiting</span>
      </div>
    </div>
  )
}
