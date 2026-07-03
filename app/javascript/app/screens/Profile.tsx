import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMe, useSignOut, useUpdateProfile } from "@/api/auth"
import { AVATAR_EMOJIS } from "@/constants"
import { XpBar } from "@/components/board"
import { BottomSheet } from "@/components/BottomSheet"
import { appTabs, TabBar } from "@/components/nav"
import { Button, EmojiPicker, Spinner, TextField } from "@/components/ui"
import { levelProgress } from "@/utils/levels"

// S16 — Profile / player card.
export function Profile() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useMe()
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState(AVATAR_EMOJIS[0])

  useEffect(() => {
    if (!isLoading && !me?.user) navigate("/", { replace: true })
  }, [isLoading, me, navigate])

  if (isLoading || !me?.user) return <Spinner />

  const user = me.user
  const progress = levelProgress(user.level, user.xpTotal)

  const openEdit = () => {
    setName(user.displayName)
    setAvatar(user.avatarEmoji)
    setEditing(true)
  }

  const save = () =>
    updateProfile.mutate(
      { display_name: name.trim(), avatar_emoji: avatar },
      { onSuccess: () => setEditing(false) }
    )

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="text-center">
          <div className="mx-auto grid h-[84px] w-[84px] place-items-center rounded-[24px] border border-line bg-gradient-to-br from-surface3 to-surface2 text-[42px]">
            {user.avatarEmoji}
          </div>
          <h1 className="mb-0.5 mt-3 font-display text-2xl font-semibold text-ink">{user.displayName}</h1>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet to-[#6d3bd6] px-3 py-1 font-display text-sm font-semibold text-white">
            ⭐ Level {user.level} · {user.levelTitle}
          </div>
        </div>

        <div className="mt-4 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3.5">
          <div className="flex justify-between text-xs text-muted">
            <span>{user.xpTotal.toLocaleString()} XP</span>
            <span>Level {user.level + 1} at {progress.next.toLocaleString()}</span>
          </div>
          <div className="mt-2">
            <XpBar percent={progress.percent} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <Stat value={`🔥${user.streakCount}`} label="day streak" tone="text-gold" />
          <Stat value={me.stats.clearedCount} label="cleared" tone="text-violet-2" />
          <Stat value={me.stats.badgesCount} label="badges" tone="text-green" />
        </div>

        <div className="mt-4 space-y-3">
          <Button variant="ghost" onClick={openEdit}>Edit avatar &amp; name</Button>
          <Button variant="danger" onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate("/") })}>
            Sign out
          </Button>
        </div>
      </div>

      <TabBar items={appTabs} />

      <BottomSheet open={editing} onClose={() => setEditing(false)}>
        <div className="mb-2 font-display text-lg font-semibold text-ink">Edit profile</div>
        <div className="my-2 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-[18px] border border-line bg-surface2 text-3xl">{avatar}</div>
        </div>
        <div className="my-2">
          <EmojiPicker options={AVATAR_EMOJIS} value={avatar} onChange={setAvatar} />
        </div>
        <TextField label="Display name" icon="🧙" value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={updateProfile.isPending || !name.trim()} onClick={save}>
          {updateProfile.isPending ? "Saving…" : "Save profile"}
        </Button>
      </BottomSheet>
    </div>
  )
}

function Stat({ value, label, tone }: { value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3 text-center">
      <div className={`font-display text-xl ${tone}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
