import { useEffect, useState } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { getConsumer } from "./consumer"
import type { MiniUser } from "@/api/types"

interface Envelope {
  type: string
  payload: Record<string, unknown>
  actor: { id: number; name: string; avatar: string } | null
}

// Patches the TanStack Query cache on incoming ActionCable events so the UI
// updates live without a manual refetch driver. REST remains the source for
// initial load + reconnect resync (invalidate → refetch).
function applyEvent(qc: QueryClient, code: string, event: Envelope, setOnline: (u: MiniUser[]) => void) {
  const invalidate = (key: unknown[]) => qc.invalidateQueries({ queryKey: key })
  const objectiveId = () => Number(event.payload.objectiveId ?? event.payload.id)

  switch (event.type) {
    case "presence":
      setOnline((event.payload.online as MiniUser[]) ?? [])
      return // presence doesn't touch data queries

    case "objective.created":
    case "objective.updated":
    case "objective.completed":
    case "objective.reopened":
    case "objective.deleted":
      invalidate(["objectives", code])
      invalidate(["objective", objectiveId()])
      invalidate(["quest", code])
      invalidate(["quests"])
      break

    case "loot_link.created":
    case "loot_link.updated":
      invalidate(["objective", objectiveId()])
      invalidate(["objectives", code])
      break

    case "comment.created":
      invalidate(["objective", objectiveId()])
      break

    case "tag.created":
      invalidate(["tags", code])
      invalidate(["objectives", code])
      break

    case "member.joined":
    case "member.left":
    case "member.xp_changed":
      invalidate(["members", code])
      invalidate(["leaderboard", code])
      invalidate(["quest", code])
      break

    case "list.updated":
      invalidate(["quest", code])
      break

    case "achievement.earned":
      invalidate(["leaderboard", code])
      invalidate(["members", code])
      break
  }

  // Every non-presence event corresponds to a feed entry.
  invalidate(["activities", code])
}

export function useListChannel(code: string) {
  const qc = useQueryClient()
  const [online, setOnline] = useState<MiniUser[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!code) return

    const subscription = getConsumer().subscriptions.create(
      { channel: "ListChannel", list_code: code },
      {
        connected: () => setConnected(true),
        disconnected: () => setConnected(false),
        rejected: () => setConnected(false),
        received: (data: Envelope) => applyEvent(qc, code, data, setOnline)
      }
    )

    return () => {
      subscription.unsubscribe()
      setOnline([])
    }
  }, [code, qc])

  return { online, connected }
}
