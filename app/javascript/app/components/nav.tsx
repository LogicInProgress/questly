import { NavLink } from "react-router-dom"

export interface TabItem {
  icon: string
  label: string
  to: string
  end?: boolean
}

export function TabBar({ items }: { items: TabItem[] }) {
  return (
    <nav className="sticky bottom-0 z-10 flex items-center justify-around border-t border-line bg-bg2 px-2 pb-3.5 pt-2.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
              isActive ? "text-violet-2" : "text-faint"
            }`
          }
        >
          <span className="text-[19px]">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export const appTabs: TabItem[] = [
  { icon: "🏠", label: "Quests", to: "/quests" },
  { icon: "🏅", label: "Badges", to: "/badges" },
  { icon: "🔔", label: "Activity", to: "/activity" },
  { icon: "🦊", label: "Me", to: "/me" }
]

export function questTabs(code: string): TabItem[] {
  return [
    { icon: "🎯", label: "Board", to: `/q/${code}`, end: true },
    { icon: "👥", label: "Party", to: `/q/${code}/party` },
    { icon: "🏆", label: "Ranks", to: `/q/${code}/ranks` },
    { icon: "📣", label: "Feed", to: `/q/${code}/feed` }
  ]
}

export function Fab({ onClick, label = "＋" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add"
      className="fixed bottom-[84px] right-[max(16px,calc(50%-224px+16px))] z-20 grid h-14 w-14 place-items-center rounded-[19px] bg-gradient-to-br from-violet to-[#6d3bd6] text-2xl text-white shadow-[0_14px_26px_-8px_rgba(139,92,246,.85)] active:scale-95"
    >
      {label}
    </button>
  )
}
