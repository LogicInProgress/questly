import { useEffect, useState } from "react"

// Shown when the ActionCable connection drops. Debounced so it doesn't flash
// during the brief resubscribe on screen navigation.
export function OfflineBanner({ connected }: { connected: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (connected) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(t)
  }, [connected])

  if (!show) return null

  return (
    <div className="sticky top-0 z-20 bg-coral/20 py-1.5 text-center text-xs font-semibold text-[#ffc2cd]">
      ⚠️ Reconnecting… live updates paused
    </div>
  )
}
