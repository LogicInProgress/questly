import { useEffect, useState } from "react"
import { useAddLootLink, useLinkPreview } from "@/api/objectives"
import type { LootLinkPreview } from "@/api/types"
import { ApiError } from "@/api/client"
import { BottomSheet } from "@/components/BottomSheet"
import { Button, Pill, TextField } from "@/components/ui"

function formatPrice(cents: number | null): string {
  if (cents == null) return ""
  return String((cents / 100).toFixed(0))
}

// S10 — Add loot link with live preview.
export function AddLootLinkSheet({
  code,
  objectiveId,
  open,
  onClose
}: {
  code: string
  objectiveId: number
  open: boolean
  onClose: () => void
}) {
  const addLink = useAddLootLink(code, objectiveId)
  const preview = useLinkPreview()

  const [url, setUrl] = useState("")
  const [kind, setKind] = useState<"buy" | "reference">("buy")
  const [price, setPrice] = useState("")
  const [previewData, setPreviewData] = useState<LootLinkPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounced preview fetch on URL change.
  useEffect(() => {
    if (!/^https?:\/\/\S+/i.test(url.trim())) {
      setPreviewData(null)
      return
    }
    const handle = setTimeout(() => {
      preview.mutate(url.trim(), {
        onSuccess: (data) => {
          setPreviewData(data)
          if (data.priceCents != null && !price) setPrice(formatPrice(data.priceCents))
        }
      })
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const reset = () => {
    setUrl("")
    setKind("buy")
    setPrice("")
    setPreviewData(null)
    setError(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = () => {
    setError(null)
    addLink.mutate(
      {
        url: url.trim(),
        kind,
        title: previewData?.title ?? undefined,
        image_url: previewData?.imageUrl ?? undefined,
        price_cents: kind === "buy" && price ? Math.round(Number(price) * 100) : undefined
      },
      {
        onSuccess: close,
        onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't attach the link.")
      }
    )
  }

  return (
    <BottomSheet open={open} onClose={close}>
      <div className="font-display text-lg font-semibold text-ink">Add a loot link</div>
      <p className="mb-3 mt-0.5 text-sm text-muted">Paste a URL — we'll pull the title & price where we can.</p>

      <TextField
        label="URL"
        icon="🔗"
        placeholder="decathlon.in/…/mh100-3p"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      {(preview.isPending || previewData) && (
        <div className="my-2 flex items-center gap-3 rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-3">
          <div className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-xl border border-line bg-bg2 text-xl">
            {previewData?.imageUrl ? (
              <img src={previewData.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "🔗"
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink">
              {preview.isPending ? "Fetching preview…" : previewData?.title}
            </div>
            <div className="text-xs text-muted">auto-detected preview</div>
          </div>
        </div>
      )}

      <div className="flex gap-2.5">
        <div className="flex-1">
          <span className="mb-1.5 mt-3 block text-xs font-semibold text-muted">Kind</span>
          <div className="flex gap-2">
            <Pill active={kind === "buy"} onClick={() => setKind("buy")}>
              🛒 Buy
            </Pill>
            <Pill active={kind === "reference"} onClick={() => setKind("reference")}>
              🔗 Reference
            </Pill>
          </div>
        </div>
        {kind === "buy" && (
          <div className="flex-1">
            <TextField
              label="Price (opt.)"
              icon="₹"
              inputMode="numeric"
              placeholder="8499"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-center text-xs text-coral">{error}</p>}

      <div className="mt-2">
        <Button disabled={addLink.isPending || !/^https?:\/\/\S+/i.test(url.trim())} onClick={submit}>
          {addLink.isPending ? "Attaching…" : "Attach loot link"}
        </Button>
      </div>
    </BottomSheet>
  )
}
