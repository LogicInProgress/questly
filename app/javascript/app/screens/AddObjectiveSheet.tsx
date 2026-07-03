import { useState } from "react"
import { useCreateObjective } from "@/api/quests"
import type { Member, Priority, Tag } from "@/api/types"
import { ApiError } from "@/api/client"
import { BottomSheet } from "@/components/BottomSheet"
import { Avatar } from "@/components/board"
import { Button, Pill, TextField } from "@/components/ui"
import { Gamification } from "@/utils/xp"

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "high", label: "🔥 High" },
  { key: "epic", label: "⭐ Epic" }
]

// S08 — Add objective bottom sheet.
export function AddObjectiveSheet({
  code,
  open,
  onClose,
  members,
  tags
}: {
  code: string
  open: boolean
  onClose: () => void
  members: Member[]
  tags: Tag[]
}) {
  const createObjective = useCreateObjective(code)
  const [title, setTitle] = useState("")
  const [dueOn, setDueOn] = useState("")
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [priority, setPriority] = useState<Priority>("low")
  const [tagIds, setTagIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle("")
    setDueOn("")
    setAssigneeId(null)
    setPriority("low")
    setTagIds([])
    setError(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const toggleTag = (id: number) =>
    setTagIds((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]))

  const xp = Gamification.potentialXp(priority, Boolean(dueOn))

  const submit = () => {
    setError(null)
    createObjective.mutate(
      {
        title: title.trim(),
        priority,
        due_on: dueOn || undefined,
        assignee_id: assigneeId ?? undefined,
        tag_ids: tagIds
      },
      {
        onSuccess: close,
        onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong.")
      }
    )
  }

  return (
    <BottomSheet open={open} onClose={close}>
      <TextField
        label="Objective"
        icon="🎯"
        placeholder="Buy portable oxygen cans"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex gap-2.5">
        <div className="flex-1">
          <TextField label="Due" icon="📅" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
        </div>
        <div className="flex-1">
          <span className="mb-1.5 mt-3 block text-xs font-semibold text-muted">Assign</span>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssigneeId((id) => (id === m.id ? null : m.id))}
                className={`rounded-xl border p-0.5 transition ${
                  assigneeId === m.id ? "border-violet" : "border-transparent"
                }`}
              >
                <Avatar emoji={m.avatarEmoji} size="sm" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="my-3">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Priority</span>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <Pill key={p.key} active={priority === p.key} onClick={() => setPriority(p.key)}>
              {p.label}
            </Pill>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="my-3">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Tags</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Pill key={t.id} active={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
                {t.emoji} {t.name}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mb-2 text-center text-xs text-coral">{error}</p>}

      <Button disabled={createObjective.isPending || !title.trim()} onClick={submit}>
        {createObjective.isPending ? "Adding…" : `Add objective · +${xp} XP on complete`}
      </Button>
    </BottomSheet>
  )
}
