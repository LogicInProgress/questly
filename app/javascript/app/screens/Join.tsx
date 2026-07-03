import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useJoin } from "@/api/auth"
import { ApiError } from "@/api/client"
import { AVATAR_EMOJIS } from "@/constants"
import { Button, EmojiPicker, Screen, ScreenHeader, TextField } from "@/components/ui"

// S02 — Join a quest (with S19 error/cooldown states and the inline S03 profile step).
export function Join() {
  const navigate = useNavigate()
  const join = useJoin()

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [needsProfile, setNeedsProfile] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState(AVATAR_EMOJIS[0])

  const [error, setError] = useState<{ code: string; message: string; triesLeft?: number } | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  useEffect(() => {
    if (cooldownLeft <= 0) return
    const t = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldownLeft])

  const submit = () => {
    setError(null)
    join.mutate(
      {
        email: email.trim(),
        join_code: code.trim(),
        password,
        ...(needsProfile ? { display_name: displayName.trim(), avatar_emoji: avatar } : {})
      },
      {
        onSuccess: (data) => navigate(`/q/${data.list.joinCode}`),
        onError: (e) => {
          if (!(e instanceof ApiError)) {
            setError({ code: "unknown", message: "Something went wrong. Try again." })
            return
          }
          if (e.code === "needs_profile") {
            setNeedsProfile(true)
            return
          }
          if (e.code === "cooldown") setCooldownLeft(Number(e.details.retryAfter) || 60)
          setError({ code: e.code ?? "error", message: e.message, triesLeft: e.details.triesLeft as number | undefined })
        }
      }
    )
  }

  // The server puts triesLeft/retryAfter alongside the error; surface what we can from the message.
  const passwordError = error && (error.code === "wrong_password" || error.code === "cooldown")

  if (needsProfile) {
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
          label="Display name"
          icon="🧙"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <div className="flex-1" />
        <Button
          variant="gold"
          disabled={join.isPending || displayName.trim().length === 0}
          onClick={submit}
        >
          {join.isPending ? "Entering…" : "Enter the party →"}
        </Button>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Enter the quest" subtitle="Ask the host for the code & password" icon="🔐" />

      <TextField
        label="Your email"
        icon="✉️"
        type="email"
        placeholder="rahul@…"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Quest code"
        icon="📜"
        placeholder="LADAKH7Q"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="tracking-[3px]"
        error={error?.code === "code_not_found" ? error.message : undefined}
      />
      <TextField
        label="Quest password"
        icon="🔑"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        invalid={Boolean(passwordError)}
      />

      {error && (error.code === "wrong_password" || error.code === "cooldown") && (
        <div className="mt-1 rounded-rs border border-coral/40 bg-coral/10 p-3 text-xs text-[#ffc2cd]">
          ⚠️ {error.message}
          {typeof error.triesLeft === "number" && error.triesLeft > 0 && (
            <> {error.triesLeft} {error.triesLeft === 1 ? "try" : "tries"} left before a 60-second cooldown.</>
          )}
          {cooldownLeft > 0 && <> Try again in {cooldownLeft}s.</>}
        </div>
      )}

      <div className="mt-4" />
      <Button
        disabled={join.isPending || cooldownLeft > 0 || !email || !code || !password}
        onClick={submit}
      >
        {join.isPending ? "Unlocking…" : cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : "Unlock quest"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        New here? Joining will set up your player profile.
      </p>
    </Screen>
  )
}
