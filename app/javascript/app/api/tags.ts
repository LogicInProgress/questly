import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import { tagsKey } from "./quests"
import type { Tag, TagInput } from "./types"

export function useCreateTag(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TagInput) =>
      api.post<{ tag: Tag }>(`/lists/${code}/tags`, input).then((r) => r.tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagsKey(code) })
      qc.invalidateQueries({ queryKey: ["objectives", code] })
    }
  })
}

export function useUpdateTag(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: TagInput & { id: number }) =>
      api.patch<{ tag: Tag }>(`/tags/${id}`, input).then((r) => r.tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagsKey(code) })
      qc.invalidateQueries({ queryKey: ["objectives", code] })
    }
  })
}

export function useDeleteTag(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/tags/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagsKey(code) })
      qc.invalidateQueries({ queryKey: ["objectives", code] })
    }
  })
}
