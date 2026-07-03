import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "./client"
import type {
  AchievementCatalogItem,
  CreateQuestInput,
  IdentifyInput,
  IdentifyResponse,
  JoinInput,
  JoinResponse,
  ListSummary,
  MeResponse
} from "./types"

export const meQueryKey = ["me"] as const

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

// Returns the current session's user + memberships, or null when not signed in.
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<MeResponse | null> => {
      try {
        return await api.get<MeResponse>("/me")
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    }
  })
}

export function useJoin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: JoinInput) =>
      api.post<JoinResponse>("/auth/join", { time_zone: browserTimeZone(), ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQueryKey })
  })
}

export function useIdentify() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IdentifyInput) =>
      api.post<IdentifyResponse>("/auth/identify", { time_zone: browserTimeZone(), ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQueryKey })
  })
}

export function useCreateQuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateQuestInput) =>
      api.post<{ list: ListSummary & { membership: { role: string; xpInList: number } } }>("/lists", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQueryKey })
  })
}

export const achievementsKey = ["achievements"] as const

export function useAchievements() {
  return useQuery({
    queryKey: achievementsKey,
    queryFn: () =>
      api.get<{ achievements: AchievementCatalogItem[]; earnedCount: number; total: number }>("/me/achievements")
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { display_name?: string; avatar_emoji?: string }) =>
      api.patch<{ user: MeResponse["user"] }>("/me", input).then((r) => r.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQueryKey })
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<void>("/auth/session"),
    onSuccess: () => qc.setQueryData(meQueryKey, null)
  })
}
