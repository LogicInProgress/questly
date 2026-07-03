// Relative + absolute due-date formatting for objective cards.
const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface DueInfo {
  label: string
  overdue: boolean
}

export function formatDue(dueOn: string | null): DueInfo | null {
  if (!dueOn) return null

  const due = new Date(dueOn + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY)

  const absolute = due.toLocaleDateString(undefined, { month: "short", day: "numeric" })

  if (days < 0) return { label: `${absolute} · overdue`, overdue: true }
  if (days === 0) return { label: "Today", overdue: false }
  if (days === 1) return { label: "Tomorrow", overdue: false }
  if (days <= 7) return { label: `In ${days} days`, overdue: false }
  return { label: absolute, overdue: false }
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.round((Date.now() - then) / 1000)
  if (secs < 60) return "just now"
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days === 1) return "yesterday"
  return `${days}d ago`
}
