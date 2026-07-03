import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCreateQuest, useMe } from "@/api/auth"
import { ApiError } from "@/api/client"
import { EMBLEM_EMOJIS, STARTER_TAG_PRESETS, TEMPLATES } from "@/constants"
import { Button, EmojiPicker, Pill, Screen, ScreenHeader, Spinner, TextField } from "@/components/ui"

// S04 — Create a quest.
export function CreateQuest() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useMe()
  const createQuest = useCreateQuest()

  const [emblem, setEmblem] = useState(EMBLEM_EMOJIS[0])
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>(["Gear", "Booking"])
  const [templateKey, setTemplateKey] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Must have an identity to create a quest.
  useEffect(() => {
    if (!isLoading && !me?.user) navigate("/onboarding", { replace: true })
  }, [isLoading, me, navigate])

  if (isLoading) return <Spinner />

  const toggleTag = (tagName: string) =>
    setSelectedTags((tags) => (tags.includes(tagName) ? tags.filter((t) => t !== tagName) : [...tags, tagName]))

  const submit = () => {
    setError(null)
    const tags = STARTER_TAG_PRESETS.filter((t) => selectedTags.includes(t.name))
    createQuest.mutate(
      { name: name.trim(), emblem_emoji: emblem, password, template_key: templateKey || undefined, tags },
      {
        onSuccess: (data) => navigate(`/q/${data.list.joinCode}`),
        onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong.")
      }
    )
  }

  return (
    <Screen>
      <ScreenHeader title="New quest" subtitle="Set it up, then invite the party" icon="✨" />

      <label className="my-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Emblem & name</span>
        <div className="flex items-center gap-2.5">
          <div className="grid h-[52px] w-[52px] flex-none place-items-center rounded-xl border border-line bg-surface text-2xl">
            {emblem}
          </div>
          <span className="flex flex-1 items-center rounded-xl border border-line bg-surface px-3 py-3 focus-within:border-violet">
            <input
              className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-faint focus:outline-none"
              placeholder="Leh–Ladakh Expedition"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </span>
        </div>
      </label>

      <div className="mb-2">
        <EmojiPicker options={EMBLEM_EMOJIS} value={emblem} onChange={setEmblem} />
      </div>

      <TextField
        label="Password (locks the quest)"
        icon="🔑"
        type="password"
        placeholder="set a shared password (min 4)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="my-3">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Starter tags</span>
        <div className="flex flex-wrap gap-2">
          {STARTER_TAG_PRESETS.map((t) => (
            <Pill key={t.name} active={selectedTags.includes(t.name)} onClick={() => toggleTag(t.name)}>
              {t.emoji} {t.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="my-3">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Use a template?</span>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key || "blank"}
              type="button"
              onClick={() => setTemplateKey(t.key)}
              className={`flex items-center gap-2 rounded-rs border p-3 text-left text-sm transition ${
                templateKey === t.key ? "border-violet bg-violet/10 text-ink" : "border-line bg-surface text-muted"
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <span>
                <span className="block font-semibold text-ink">{t.label}</span>
                {t.count > 0 && <span className="block text-[11px] text-faint">{t.count} objectives</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-1 text-center text-xs text-coral">{error}</p>}

      <div className="flex-1" />
      <Button
        disabled={createQuest.isPending || !name.trim() || password.length < 4}
        onClick={submit}
      >
        {createQuest.isPending ? "Creating…" : "Create & get share code"}
      </Button>
    </Screen>
  )
}
