import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useIdentify, useMe } from "@/api/auth"
import { ApiError } from "@/api/client"
import { AVATAR_EMOJIS } from "@/constants"
import { Button, EmojiPicker, Screen, ScreenHeader, Spinner, TextField } from "@/components/ui"

// S03 — Create profile / establish identity for the "Start a quest" path.
export function Onboarding() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useMe()
  const identify = useIdentify()

  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState(AVATAR_EMOJIS[0])
  const [error, setError] = useState<string | null>(null)

  // Already signed in → straight to quest creation.
  useEffect(() => {
    if (me?.user) navigate("/new", { replace: true })
  }, [me, navigate])

  if (isLoading) return <Spinner />

  const submit = () => {
    setError(null)
    identify.mutate(
      { email: email.trim(), display_name: displayName.trim(), avatar_emoji: avatar },
      {
        onSuccess: () => navigate("/new"),
        onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong.")
      }
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Who's playing?" subtitle="This is how the party sees you" />

      <div className="my-2 flex justify-center">
        <div className="grid h-20 w-20 place-items-center rounded-[20px] border border-line bg-gradient-to-br from-surface3 to-surface2 text-4xl">
          {avatar}
        </div>
      </div>
      <div className="my-3">
        <EmojiPicker options={AVATAR_EMOJIS} value={avatar} onChange={setAvatar} />
      </div>

      <TextField
        label="Your email"
        icon="✉️"
        type="email"
        placeholder="rahul@…"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Display name"
        icon="🧙"
        placeholder="Your name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <div className="mt-2 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg2 text-xl">🎁</div>
          <div>
            <div className="font-display text-sm font-semibold text-ink">Welcome bonus</div>
            <div className="text-xs text-muted">+50 XP for starting your first quest</div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-center text-xs text-coral">{error}</p>}

      <div className="flex-1" />
      <Button
        variant="gold"
        disabled={identify.isPending || !email.trim() || !displayName.trim()}
        onClick={submit}
      >
        {identify.isPending ? "Setting up…" : "Continue →"}
      </Button>
    </Screen>
  )
}
