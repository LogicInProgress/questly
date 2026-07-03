import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import { meQueryKey } from "./auth"
import { questKey, questsKey } from "./quests"
import type {
  Comment,
  CompleteResult,
  CreateLootLinkInput,
  LootLink,
  LootLinkPreview,
  ObjectiveDetail
} from "./types"

export const objectiveKey = (id: number | string) => ["objective", Number(id)] as const

// Invalidate everything that reflects an objective change within a quest.
function invalidateQuest(qc: ReturnType<typeof useQueryClient>, code: string, id: number) {
  qc.invalidateQueries({ queryKey: objectiveKey(id) })
  qc.invalidateQueries({ queryKey: ["objectives", code] })
  qc.invalidateQueries({ queryKey: questKey(code) })
  qc.invalidateQueries({ queryKey: questsKey })
  qc.invalidateQueries({ queryKey: meQueryKey })
}

export function useObjective(id: number | string) {
  return useQuery({
    queryKey: objectiveKey(id),
    queryFn: () => api.get<{ objective: ObjectiveDetail }>(`/objectives/${id}`).then((r) => r.objective)
  })
}

export function useCompleteObjective(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<CompleteResult>(`/objectives/${id}/complete`),
    onSuccess: (_data, id) => invalidateQuest(qc, code, id)
  })
}

export function useReopenObjective(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<{ objective: ObjectiveDetail }>(`/objectives/${id}/reopen`),
    onSuccess: (_data, id) => invalidateQuest(qc, code, id)
  })
}

export function useDeleteObjective(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/objectives/${id}`),
    onSuccess: (_data, id) => invalidateQuest(qc, code, id)
  })
}

export function useLinkPreview() {
  return useMutation({
    mutationFn: (url: string) => api.post<LootLinkPreview>("/loot_links/preview", { url })
  })
}

export function useAddLootLink(code: string, objectiveId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLootLinkInput) =>
      api.post<{ lootLink: LootLink }>(`/objectives/${objectiveId}/loot_links`, input).then((r) => r.lootLink),
    onSuccess: () => invalidateQuest(qc, code, objectiveId)
  })
}

export function useDeleteLootLink(code: string, objectiveId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/loot_links/${id}`),
    onSuccess: () => invalidateQuest(qc, code, objectiveId)
  })
}

export function useAddComment(objectiveId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      api.post<{ comment: Comment }>(`/objectives/${objectiveId}/comments`, { body }).then((r) => r.comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: objectiveKey(objectiveId) })
  })
}
