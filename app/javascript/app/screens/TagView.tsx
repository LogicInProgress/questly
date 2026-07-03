import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTags } from "@/api/quests"
import { useCreateTag } from "@/api/tags"
import { BottomSheet } from "@/components/BottomSheet"
import { Button, EmojiPicker, Screen, ScreenHeader, Spinner, TextField } from "@/components/ui"

const TAG_EMOJIS = ["🎒", "📄", "🏨", "💊", "🍜", "💰", "🎯", "🏔️", "🔧", "📸", "🎟️", "🧭"]
const TAG_COLORS = ["#8b5cf6", "#ffc94d", "#4ade80", "#fb7185", "#38bdf8"]

// S07 — Tag view (filter grid).
export function TagView() {
  const { code = "" } = useParams()
  const navigate = useNavigate()
  const { data: tags, isLoading } = useTags(code)
  const createTag = useCreateTag(code)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState(TAG_EMOJIS[0])
  const [color, setColor] = useState(TAG_COLORS[0])

  if (isLoading) return <Spinner />

  const submit = () => {
    createTag.mutate(
      { name: name.trim(), emoji, color },
      {
        onSuccess: () => {
          setOpen(false)
          setName("")
          setEmoji(TAG_EMOJIS[0])
          setColor(TAG_COLORS[0])
        }
      }
    )
  }

  return (
    <Screen>
      <div className="mb-1 flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(`/q/${code}`)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface2 text-lg text-muted"
        >
          ←
        </button>
        <ScreenHeader title="Filter by tag" subtitle="Tap to narrow the board" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tags?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(`/q/${code}`, { state: { tagId: t.id } })}
            className="rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3.5 text-left"
            style={{ borderColor: `${t.color}55` }}
          >
            <div className="text-2xl">{t.emoji}</div>
            <div className="mt-1.5 font-display text-sm font-semibold text-ink">{t.name}</div>
            <div className="text-xs text-muted">
              {t.objectivesCount ?? 0} {t.objectivesCount === 1 ? "objective" : "objectives"}
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid place-items-center rounded-r border border-dashed border-line bg-surface/40 p-3.5 text-center"
        >
          <div className="text-xl">＋</div>
          <div className="mt-1 text-xs text-muted">New tag</div>
        </button>
      </div>

      <p className="mt-4 text-xs text-muted">Tags are shared across the party and reusable on any objective.</p>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="mb-2 font-display text-lg font-semibold text-ink">New tag</div>
        <div className="my-2">
          <EmojiPicker options={TAG_EMOJIS} value={emoji} onChange={setEmoji} />
        </div>
        <TextField label="Name" icon={emoji} placeholder="Gear" value={name} onChange={(e) => setName(e.target.value)} />
        <span className="mb-1.5 mt-2 block text-xs font-semibold text-muted">Colour</span>
        <div className="mb-3 flex gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`colour ${c}`}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-lg border-2 ${color === c ? "border-ink" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <Button disabled={createTag.isPending || !name.trim()} onClick={submit}>
          {createTag.isPending ? "Creating…" : "Create tag"}
        </Button>
      </BottomSheet>
    </Screen>
  )
}
