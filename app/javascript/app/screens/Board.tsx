import { useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useMembers, useObjectives, useQuest, useTags } from "@/api/quests"
import type { Objective, ObjectiveFilters, Tag } from "@/api/types"
import { useListChannel } from "@/cable/useListChannel"
import { Avatar, ObjectiveRow, SectionTitle, XpBar } from "@/components/board"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Fab, questTabs, TabBar } from "@/components/nav"
import { Pill, Spinner } from "@/components/ui"
import { AddObjectiveSheet } from "./AddObjectiveSheet"

type Filter = { type: "all" } | { type: "tag"; id: number } | { type: "soon" }

// S06 — Quest board.
export function Board() {
  const { code = "" } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Tag view (S07) deep-links into the board with a preselected tag filter.
  const initialTagId = (location.state as { tagId?: number } | null)?.tagId
  const [filter, setFilter] = useState<Filter>(initialTagId ? { type: "tag", id: initialTagId } : { type: "all" })
  const [sheetOpen, setSheetOpen] = useState(false)

  const apiFilters: ObjectiveFilters =
    filter.type === "tag" ? { tag: filter.id } : filter.type === "soon" ? { due: "soon" } : {}

  const quest = useQuest(code)
  const objectives = useObjectives(code, apiFilters)
  const tags = useTags(code)
  const members = useMembers(code)
  const { online, connected } = useListChannel(code)

  if (quest.isLoading || objectives.isLoading || tags.isLoading) return <Spinner />
  if (quest.isError || !quest.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center text-muted">
        Couldn't load this quest. Check the code or your access.
      </div>
    )
  }

  const { progress } = quest.data
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <OfflineBanner connected={connected} />
      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Back to quests"
              onClick={() => navigate("/quests")}
              className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-line bg-surface2 text-lg text-muted"
            >
              ←
            </button>
            <Avatar emoji={quest.data.emblemEmoji} />
            <div>
              <div className="font-display text-lg font-semibold text-ink">{quest.data.name}</div>
              <div className="text-xs text-muted">
                👥 {quest.data.membersCount} · code {quest.data.joinCode}
                {online.length > 0 && <span className="text-green"> · 🟢 {online.length} online</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate(`/q/${code}/settings`)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-gradient-to-br from-surface3 to-surface2 text-lg"
          >
            ⚙️
          </button>
        </div>

        <XpBar percent={percent} />
        <div className="mt-1.5 flex justify-between text-xs text-muted">
          <span>
            {progress.done} / {progress.total} objectives
          </span>
          <span className="font-semibold text-violet-2">{percent}% cleared</span>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Pill active={filter.type === "all"} onClick={() => setFilter({ type: "all" })}>
            🏷️ All
          </Pill>
          {tags.data?.map((t) => (
            <Pill
              key={t.id}
              active={filter.type === "tag" && filter.id === t.id}
              onClick={() => setFilter({ type: "tag", id: t.id })}
            >
              {t.emoji} {t.name}
            </Pill>
          ))}
          <Pill active={filter.type === "soon"} onClick={() => setFilter({ type: "soon" })}>
            ⏰ Due soon
          </Pill>
          <Pill onClick={() => navigate(`/q/${code}/tags`)}>🏷️ Tags</Pill>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2">
        <ObjectiveGroups
          filter={filter}
          objectives={objectives.data ?? []}
          tags={tags.data ?? []}
          onOpen={(id) => navigate(`/q/${code}/objective/${id}`)}
        />
      </div>

      <TabBar items={questTabs(code)} />
      <Fab onClick={() => setSheetOpen(true)} />

      <AddObjectiveSheet
        code={code}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        members={members.data ?? []}
        tags={tags.data ?? []}
      />
    </div>
  )
}

function ObjectiveGroups({
  filter,
  objectives,
  tags,
  onOpen
}: {
  filter: Filter
  objectives: Objective[]
  tags: Tag[]
  onOpen: (id: number) => void
}) {
  // Group by first tag when unfiltered; otherwise a single flat list.
  const grouped = useMemo(() => {
    if (filter.type !== "all") return null
    const byTag = new Map<number | "untagged", Objective[]>()
    for (const obj of objectives) {
      const key = obj.tags[0]?.id ?? "untagged"
      if (!byTag.has(key)) byTag.set(key, [])
      byTag.get(key)!.push(obj)
    }
    return byTag
  }, [filter, objectives])

  if (objectives.length === 0) {
    return <p className="mt-10 text-center text-sm text-faint">No objectives here yet. Tap ＋ to add one.</p>
  }

  if (filter.type !== "all" || !grouped) {
    return (
      <>
        {objectives.map((o) => (
          <ObjectiveRow key={o.id} objective={o} onClick={() => onOpen(o.id)} />
        ))}
      </>
    )
  }

  return (
    <>
      {tags.map((tag) => {
        const items = grouped.get(tag.id)
        if (!items || items.length === 0) return null
        const open = items.filter((o) => o.status === "open").length
        return (
          <div key={tag.id}>
            <SectionTitle count={`${open} open`}>
              {tag.emoji} {tag.name}
            </SectionTitle>
            {items.map((o) => (
              <ObjectiveRow key={o.id} objective={o} onClick={() => onOpen(o.id)} />
            ))}
          </div>
        )
      })}
      {grouped.get("untagged") && (
        <div>
          <SectionTitle count={`${grouped.get("untagged")!.filter((o) => o.status === "open").length} open`}>
            📌 Untagged
          </SectionTitle>
          {grouped.get("untagged")!.map((o) => (
            <ObjectiveRow key={o.id} objective={o} onClick={() => onOpen(o.id)} />
          ))}
        </div>
      )}
    </>
  )
}
