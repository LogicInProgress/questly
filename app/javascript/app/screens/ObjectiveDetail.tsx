import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  useAddComment,
  useCompleteObjective,
  useDeleteLootLink,
  useObjective,
  useReopenObjective
} from "@/api/objectives"
import type { CompleteResult, LootLink } from "@/api/types"
import { Avatar } from "@/components/board"
import { Celebration } from "@/components/Celebration"
import { Button, Spinner } from "@/components/ui"
import { formatDue, timeAgo } from "@/utils/dates"
import { AddLootLinkSheet } from "./AddLootLinkSheet"

const PRIORITY_LABEL: Record<string, string> = { low: "Low", high: "🔥 High", epic: "⭐ Epic" }

function priceLabel(link: LootLink): string {
  if (link.priceCents == null) return link.kind === "buy" ? "buy" : "reference"
  const symbol = link.currency === "INR" ? "₹" : link.currency === "USD" ? "$" : `${link.currency} `
  return `${symbol}${(link.priceCents / 100).toLocaleString()}`
}

// S09 — Objective detail.
export function ObjectiveDetail() {
  const { code = "", id = "" } = useParams()
  const navigate = useNavigate()
  const { data: objective, isLoading } = useObjective(id)
  const complete = useCompleteObjective(code)
  const reopen = useReopenObjective(code)
  const addComment = useAddComment(Number(id))
  const deleteLink = useDeleteLootLink(code, Number(id))

  const [sheetOpen, setSheetOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [celebration, setCelebration] = useState<CompleteResult | null>(null)

  if (isLoading || !objective) return <Spinner />

  const done = objective.status === "done"
  const due = formatDue(objective.dueOn)

  const onComplete = () =>
    complete.mutate(objective.id, {
      onSuccess: (res) => setCelebration(res)
    })

  const onSendComment = () => {
    const body = comment.trim()
    if (!body) return
    addComment.mutate(body, { onSuccess: () => setComment("") })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(`/q/${code}`)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface2 text-lg text-muted"
        >
          ←
        </button>
        <span className="rounded-full border border-violet/30 bg-violet/15 px-3 py-1 text-xs font-semibold text-violet-2">
          +{objective.potentialXp} XP
        </span>
      </div>

      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{objective.title}</h1>
      {objective.description && <p className="mt-1 text-sm text-muted">{objective.description}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {due && (
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${due.overdue ? "border-coral/30 bg-coral/10 text-[#ffc2cd]" : "border-line bg-surface2 text-muted"}`}>
            ⏰ {due.label}
          </span>
        )}
        {objective.tags.map((t) => (
          <span key={t.id} className="rounded-full border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-muted">
            {t.emoji} {t.name}
          </span>
        ))}
        {objective.priority !== "low" && (
          <span className="rounded-full border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-muted">
            {PRIORITY_LABEL[objective.priority]}
          </span>
        )}
      </div>

      {objective.assignee && (
        <div className="mt-3.5 flex items-center gap-2.5">
          <span className="text-xs text-muted">Assigned to</span>
          <Avatar emoji={objective.assignee.avatarEmoji} size="sm" />
          <b className="text-[13px] text-ink">{objective.assignee.displayName}</b>
        </div>
      )}

      {/* Loot links */}
      <SectionLabel count={objective.lootLinks.length}>🎒 Loot links</SectionLabel>
      {objective.lootLinks.map((link) => (
        <div key={link.id} className="mb-2.5 flex items-center gap-3 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3">
          <div className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-xl border border-line bg-bg2 text-lg">
            {link.imageUrl ? <img src={link.imageUrl} alt="" className="h-full w-full object-cover" /> : link.kind === "buy" ? "🛒" : "🔗"}
          </div>
          <a href={link.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">{link.title}</div>
            <div className="truncate text-xs text-muted">{priceLabel(link)} · tap to open</div>
          </a>
          <button type="button" aria-label="Open" className="text-lg text-sky">↗</button>
          <button
            type="button"
            aria-label="Remove loot link"
            onClick={() => deleteLink.mutate(link.id)}
            className="text-sm text-faint hover:text-coral"
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => setSheetOpen(true)} className="!py-2.5 text-sm">
        🔗 Add loot link
      </Button>

      {/* Party chat */}
      <SectionLabel count={objective.comments.length}>💬 Party chat</SectionLabel>
      {objective.comments.map((c) => (
        <div key={c.id} className="mb-3 flex gap-3">
          <Avatar emoji={c.user.avatarEmoji} size="sm" />
          <div className="text-[13px]">
            <span className="text-ink">
              <b>{c.user.displayName}:</b> {c.body}
            </span>
            <div className="mt-0.5 text-[11px] text-faint">{timeAgo(c.createdAt)}</div>
          </div>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2">
        <input
          className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-violet focus:outline-none"
          placeholder="Add to the chat…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendComment()}
        />
        <button
          type="button"
          onClick={onSendComment}
          disabled={addComment.isPending || !comment.trim()}
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-violet to-[#6d3bd6] text-white disabled:opacity-50"
        >
          ➤
        </button>
      </div>

      <div className="flex-1" />

      <div className="mt-4">
        {done ? (
          <Button variant="ghost" disabled={reopen.isPending} onClick={() => reopen.mutate(objective.id)}>
            ↩ Reopen objective
          </Button>
        ) : (
          <Button variant="gold" disabled={complete.isPending} onClick={onComplete}>
            {complete.isPending ? "Completing…" : "✓ Mark complete"}
          </Button>
        )}
      </div>

      <AddLootLinkSheet code={code} objectiveId={objective.id} open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {celebration && (
        <Celebration
          result={celebration}
          title={objective.title}
          onDismiss={() => {
            setCelebration(null)
            navigate(`/q/${code}`)
          }}
        />
      )}
    </div>
  )
}

function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="mx-0.5 mb-2.5 mt-5 flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-wide text-muted">
      {children} <span className="text-[11px] font-normal text-faint">{count}</span>
    </div>
  )
}
