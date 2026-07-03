import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useDeleteQuest, useLeaveQuest, useQuest, useUpdateQuest } from "@/api/quests"
import { EMBLEM_EMOJIS } from "@/constants"
import { BottomSheet } from "@/components/BottomSheet"
import { Button, EmojiPicker, Screen, Spinner, TextField } from "@/components/ui"

type Sheet = "none" | "name" | "password"

// S17 — Quest settings (host controls).
export function Settings() {
  const { code = "" } = useParams()
  const navigate = useNavigate()
  const quest = useQuest(code)
  const updateQuest = useUpdateQuest(code)
  const deleteQuest = useDeleteQuest()
  const leaveQuest = useLeaveQuest()

  const [sheet, setSheet] = useState<Sheet>("none")
  const [name, setName] = useState("")
  const [emblem, setEmblem] = useState(EMBLEM_EMOJIS[0])
  const [password, setPassword] = useState("")

  if (quest.isLoading || !quest.data) return <Spinner />
  const isHost = quest.data.role === "host"

  const openName = () => {
    setName(quest.data!.name)
    setEmblem(quest.data!.emblemEmoji)
    setSheet("name")
  }

  const saveName = () =>
    updateQuest.mutate({ name: name.trim(), emblem_emoji: emblem }, { onSuccess: () => setSheet("none") })

  const savePassword = () =>
    updateQuest.mutate({ password }, { onSuccess: () => { setPassword(""); setSheet("none") } })

  const remove = () => {
    if (!confirm("Delete this quest for everyone? This can't be undone.")) return
    deleteQuest.mutate(code, { onSuccess: () => navigate("/quests") })
  }

  const leave = () => {
    if (!confirm("Leave this quest?")) return
    leaveQuest.mutate(code, { onSuccess: () => navigate("/quests") })
  }

  return (
    <Screen>
      <div className="mb-2 flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(`/q/${code}`)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface2 text-lg text-muted"
        >
          ←
        </button>
        <h1 className="font-display text-lg font-semibold text-ink">Settings</h1>
      </div>

      {isHost ? (
        <>
          <SectionLabel>Quest</SectionLabel>
          <Row icon={quest.data.emblemEmoji} title="Name & emblem" meta={quest.data.name} onClick={openName} />
          <Row icon="🔑" title="Change password" meta="Tap to set a new shared password" onClick={() => setSheet("password")} />
          <Row icon="🏷️" title="Manage tags" meta="Add or edit quest tags" onClick={() => navigate(`/q/${code}/tags`)} />

          <SectionLabel>Party</SectionLabel>
          <Row icon="👥" title="Members & roles" meta={`${quest.data.membersCount} ${quest.data.membersCount === 1 ? "member" : "members"}`} onClick={() => navigate(`/q/${code}/party`)} />

          <div className="flex-1" />
          <Button variant="danger" onClick={remove} disabled={deleteQuest.isPending}>
            Delete quest
          </Button>
        </>
      ) : (
        <>
          <SectionLabel>Party</SectionLabel>
          <Row icon="👥" title="Members" meta={`${quest.data.membersCount} members`} onClick={() => navigate(`/q/${code}/party`)} />
          <div className="flex-1" />
          <Button variant="danger" onClick={leave} disabled={leaveQuest.isPending}>
            Leave quest
          </Button>
        </>
      )}

      <BottomSheet open={sheet === "name"} onClose={() => setSheet("none")}>
        <div className="mb-2 font-display text-lg font-semibold text-ink">Name & emblem</div>
        <div className="my-2">
          <EmojiPicker options={EMBLEM_EMOJIS} value={emblem} onChange={setEmblem} />
        </div>
        <TextField label="Quest name" icon={emblem} value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={updateQuest.isPending || !name.trim()} onClick={saveName}>
          {updateQuest.isPending ? "Saving…" : "Save"}
        </Button>
      </BottomSheet>

      <BottomSheet open={sheet === "password"} onClose={() => setSheet("none")}>
        <div className="mb-2 font-display text-lg font-semibold text-ink">Change password</div>
        <TextField
          label="New password (min 4)"
          icon="🔑"
          type="password"
          placeholder="new shared password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button disabled={updateQuest.isPending || password.length < 4} onClick={savePassword}>
          {updateQuest.isPending ? "Saving…" : "Update password"}
        </Button>
      </BottomSheet>
    </Screen>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-0.5 mb-2 mt-4 font-display text-[13px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  )
}

function Row({ icon, title, meta, onClick }: { icon: React.ReactNode; title: string; meta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2.5 flex w-full items-center gap-3 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3 text-left"
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{meta}</span>
      </span>
      <span className="text-faint">›</span>
    </button>
  )
}
