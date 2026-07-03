import type { ReactNode } from "react"
import type { MiniUser, Objective } from "@/api/types"
import { formatDue } from "@/utils/dates"

const AVATAR_SIZES = {
  sm: "h-[26px] w-[26px] rounded-[9px] text-[13px]",
  md: "h-[34px] w-[34px] rounded-xl text-[17px]",
  lg: "h-16 w-16 rounded-[20px] text-3xl"
}

export function Avatar({
  emoji,
  size = "md",
  className = ""
}: {
  emoji: ReactNode
  size?: keyof typeof AVATAR_SIZES
  className?: string
}) {
  return (
    <div
      className={`grid flex-none place-items-center border border-line bg-gradient-to-br from-surface3 to-surface2 ${AVATAR_SIZES[size]} ${className}`}
    >
      {emoji}
    </div>
  )
}

export function AvatarStack({ users, max = 4 }: { users: MiniUser[]; max?: number }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <div className="flex">
      {shown.map((u, i) => (
        <div key={u.id} className="ring-2 ring-bg2" style={{ marginLeft: i === 0 ? 0 : -9, borderRadius: 9 }}>
          <Avatar emoji={u.avatarEmoji} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div className="ml-[-9px] grid h-[26px] w-[26px] place-items-center rounded-[9px] border border-line bg-surface2 text-[11px] text-muted ring-2 ring-bg2">
          +{extra}
        </div>
      )}
    </div>
  )
}

export function XpBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative h-[11px] overflow-hidden rounded-full border border-line bg-surface">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet to-[#c4a6ff] transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: ReactNode }) {
  return (
    <div className="mx-0.5 mb-2.5 mt-4 flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-wide text-muted">
      {children}
      {count != null && <span className="text-[11px] font-normal text-faint">{count}</span>}
    </div>
  )
}

const PRIORITY_LABEL: Record<string, string> = { low: "Low", high: "🔥 High", epic: "⭐ Epic" }

function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "sky" | "coral" | "violet" | "green" }) {
  const tones = {
    muted: "border-line bg-surface2 text-muted",
    sky: "border-sky/30 bg-sky/10 text-[#bae6fd]",
    coral: "border-coral/30 bg-coral/10 text-[#ffc2cd]",
    violet: "border-violet/30 bg-violet/15 text-violet-2",
    green: "border-green/30 bg-green/10 text-[#bbf7d0]"
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

function formatPrice(cents: number | null, currency: string): string | null {
  if (cents == null) return null
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `
  return `${symbol}${(cents / 100).toLocaleString()}`
}

export function ObjectiveRow({ objective, onClick }: { objective: Objective; onClick?: () => void }) {
  const done = objective.status === "done"
  const due = formatDue(objective.dueOn)

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2.5 flex w-full items-start gap-3 rounded-rs border border-line bg-surface p-3 text-left transition active:scale-[.995]"
    >
      <span
        className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-lg border-2 ${
          done ? "border-transparent bg-gradient-to-br from-green to-[#22c55e] text-[#04310f]" : "border-faint"
        }`}
      >
        {done && <span className="text-sm font-extrabold">✓</span>}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${done ? "text-muted line-through" : "text-ink"}`}>
          {objective.title}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {done ? (
            <Chip tone="green">
              ✓ {objective.completer ? `by ${objective.completer.displayName}` : "done"}
              {objective.awardedXp ? ` · +${objective.awardedXp} XP` : ""}
            </Chip>
          ) : (
            <>
              {objective.lootLinks.map((l) => (
                <Chip key={l.id} tone="sky">
                  {l.kind === "buy" ? "🛒" : "🔗"} {l.title}
                  {formatPrice(l.priceCents, l.currency) ? ` · ${formatPrice(l.priceCents, l.currency)}` : ""}
                </Chip>
              ))}
              {due && <Chip tone={due.overdue ? "coral" : "muted"}>⏰ {due.label}</Chip>}
              {objective.tags.map((t) => (
                <Chip key={t.id}>
                  {t.emoji} {t.name}
                </Chip>
              ))}
              {objective.priority !== "low" && <Chip>{PRIORITY_LABEL[objective.priority]}</Chip>}
              <Chip tone="violet">+{objective.potentialXp} XP</Chip>
            </>
          )}
        </span>
      </span>

      {objective.assignee && <Avatar emoji={objective.assignee.avatarEmoji} size="sm" />}
    </button>
  )
}
