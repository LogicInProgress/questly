import { Routes, Route, Link, useLocation } from "react-router-dom"
import { Splash } from "@/screens/Splash"
import { Join } from "@/screens/Join"
import { Onboarding } from "@/screens/Onboarding"
import { CreateQuest } from "@/screens/CreateQuest"
import { Dashboard } from "@/screens/Dashboard"
import { Board } from "@/screens/Board"
import { ObjectiveDetail } from "@/screens/ObjectiveDetail"
import { TagView } from "@/screens/TagView"
import { ActivityFeed } from "@/screens/ActivityFeed"
import { Leaderboard } from "@/screens/Leaderboard"
import { Badges } from "@/screens/Badges"
import { Party } from "@/screens/Party"
import { Profile } from "@/screens/Profile"
import { Settings } from "@/screens/Settings"

// Placeholder for screens built in later phases.
function Placeholder({ title, screen }: { title: string; screen: string }) {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-br from-violet to-[#6d3bd6] text-4xl shadow-card">
        ⚔️
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {screen} · <code className="text-violet-2">{pathname}</code>
        </p>
      </div>
      <p className="max-w-xs text-sm text-faint">Built in a later phase.</p>
      <Link to="/" className="rounded-rs border border-line bg-surface2 px-4 py-2 text-sm font-semibold text-ink">
        ← Splash
      </Link>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/join" element={<Join />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/new" element={<CreateQuest />} />

      <Route path="/quests" element={<Dashboard />} />
      <Route path="/q/:code" element={<Board />} />
      <Route path="/q/:code/tags" element={<TagView />} />
      <Route path="/q/:code/objective/:id" element={<ObjectiveDetail />} />
      <Route path="/q/:code/party" element={<Party />} />
      <Route path="/q/:code/ranks" element={<Leaderboard />} />
      <Route path="/q/:code/feed" element={<ActivityFeed />} />
      <Route path="/q/:code/settings" element={<Settings />} />
      <Route path="/me" element={<Profile />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/activity" element={<Placeholder title="Activity" screen="Cross-quest activity — coming soon" />} />
      <Route path="*" element={<Placeholder title="Not found" screen="404" />} />
    </Routes>
  )
}
