import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import { meQueryKey } from "./auth"
import type {
  ActivityItem,
  CreateObjectiveInput,
  LeaderboardRow,
  Member,
  Objective,
  ObjectiveFilters,
  QuestCardData,
  QuestDetail,
  Tag
} from "./types"

export const questsKey = ["quests"] as const
export const questKey = (code: string) => ["quest", code] as const
export const objectivesKey = (code: string, filters?: ObjectiveFilters) =>
  ["objectives", code, filters ?? {}] as const
export const tagsKey = (code: string) => ["tags", code] as const
export const membersKey = (code: string) => ["members", code] as const

export function useQuests() {
  return useQuery({
    queryKey: questsKey,
    queryFn: () => api.get<{ lists: QuestCardData[] }>("/lists").then((r) => r.lists)
  })
}

export function useQuest(code: string) {
  return useQuery({
    queryKey: questKey(code),
    queryFn: () => api.get<{ list: QuestDetail }>(`/lists/${code}`).then((r) => r.list)
  })
}

export function useObjectives(code: string, filters: ObjectiveFilters = {}) {
  const qs = new URLSearchParams()
  if (filters.tag) qs.set("tag", String(filters.tag))
  if (filters.status) qs.set("status", filters.status)
  if (filters.due) qs.set("due", filters.due)
  const suffix = qs.toString() ? `?${qs}` : ""

  return useQuery({
    queryKey: objectivesKey(code, filters),
    queryFn: () =>
      api.get<{ objectives: Objective[] }>(`/lists/${code}/objectives${suffix}`).then((r) => r.objectives)
  })
}

export function useTags(code: string) {
  return useQuery({
    queryKey: tagsKey(code),
    queryFn: () => api.get<{ tags: Tag[] }>(`/lists/${code}/tags`).then((r) => r.tags)
  })
}

export function useMembers(code: string) {
  return useQuery({
    queryKey: membersKey(code),
    queryFn: () => api.get<{ members: Member[] }>(`/lists/${code}/members`).then((r) => r.members)
  })
}

export const leaderboardKey = (code: string) => ["leaderboard", code] as const

export function useLeaderboard(code: string) {
  return useQuery({
    queryKey: leaderboardKey(code),
    queryFn: () =>
      api.get<{ leaderboard: LeaderboardRow[] }>(`/lists/${code}/leaderboard`).then((r) => r.leaderboard)
  })
}

export const activitiesKey = (code: string) => ["activities", code] as const

export function useActivities(code: string) {
  return useQuery({
    queryKey: activitiesKey(code),
    queryFn: () =>
      api.get<{ activities: ActivityItem[] }>(`/lists/${code}/activities`).then((r) => r.activities)
  })
}

export function useUpdateQuest(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<{ name: string; emblem_emoji: string; description: string; cover_color: string; password: string }>) =>
      api.patch<{ list: QuestDetail }>(`/lists/${code}`, input).then((r) => r.list),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questKey(code) })
      qc.invalidateQueries({ queryKey: questsKey })
    }
  })
}

export function useDeleteQuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => api.delete<void>(`/lists/${code}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questsKey })
  })
}

export function useLeaveQuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => api.delete<void>(`/lists/${code}/leave`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questsKey })
  })
}

export function useRemoveMember(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.delete<void>(`/lists/${code}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membersKey(code) })
      qc.invalidateQueries({ queryKey: questKey(code) })
      qc.invalidateQueries({ queryKey: leaderboardKey(code) })
    }
  })
}

export function useCreateObjective(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateObjectiveInput) =>
      api.post<{ objective: Objective }>(`/lists/${code}/objectives`, input).then((r) => r.objective),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["objectives", code] })
      qc.invalidateQueries({ queryKey: questKey(code) })
      qc.invalidateQueries({ queryKey: tagsKey(code) })
      qc.invalidateQueries({ queryKey: questsKey })
      qc.invalidateQueries({ queryKey: meQueryKey })
    }
  })
}
