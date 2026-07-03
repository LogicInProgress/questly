import { useEffect } from "react"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import type { CompleteResult } from "@/api/types"
import { Button } from "@/components/ui"
import { XpBar } from "@/components/board"
import { levelProgress } from "@/utils/levels"

const CONFETTI_COLORS = ["#8b5cf6", "#ffc94d", "#4ade80", "#fb7185", "#38bdf8"]

// S11 — Celebration overlay on objective complete.
export function Celebration({
  result,
  title,
  onDismiss
}: {
  result: CompleteResult
  title: string
  onDismiss: () => void
}) {
  const reduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (reduced) return
    const end = Date.now() + 900
    let raf = 0
    const frame = () => {
      confetti({ particleCount: 5, spread: 70, startVelocity: 45, origin: { y: 0.35 }, colors: CONFETTI_COLORS, disableForReducedMotion: true })
      if (Date.now() < end) raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const progress = levelProgress(result.level, result.xpTotal)

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "radial-gradient(circle at 50% 34%, rgba(139,92,246,.35), #1b1636 70%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-[76px]"
        style={{ filter: "drop-shadow(0 12px 22px rgba(255,201,77,.5))" }}
        animate={reduced ? {} : { scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        🏆
      </motion.div>

      <h2 className="mb-1 mt-4 font-display text-2xl font-semibold text-ink">
        {result.leveledUp ? `Level ${result.level}!` : "Objective cleared!"}
      </h2>
      <p className="max-w-[220px] text-sm text-muted">{title}</p>

      <div className="mt-3.5 rounded-full bg-gradient-to-br from-[#ffd873] to-gold px-4 py-2 font-display text-[15px] font-semibold text-[#3a2a00]">
        ＋{result.xpAwarded} XP
      </div>

      <div className="mt-4 w-[200px]">
        <XpBar percent={progress.percent} />
      </div>
      <div className="mt-2 text-xs text-muted">{progress.toNext} XP to Level {result.level + 1}</div>

      {result.newAchievements.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-4">
          {result.newAchievements.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-1.5">
              <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[#ffd873] to-gold text-2xl shadow-[0_10px_20px_-8px_rgba(255,201,77,.6)]">
                {badge.icon}
              </div>
              <div className="text-[11px] font-semibold text-gold">{badge.name}</div>
            </div>
          ))}
          <div className="w-full text-xs text-muted">🏅 New badge{result.newAchievements.length > 1 ? "s" : ""} unlocked!</div>
        </div>
      )}

      <div className="mt-6 w-[200px]">
        <Button onClick={onDismiss}>Keep questing</Button>
      </div>
    </motion.div>
  )
}
