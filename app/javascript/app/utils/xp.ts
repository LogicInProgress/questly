import type { Priority } from "@/api/types"

// Mirrors the server's Gamification rules for display (button preview).
const XP_BASE = 10
const PRIORITY_BONUS: Record<Priority, number> = { low: 0, high: 10, epic: 25 }
const ON_TIME_BONUS = 10

export const Gamification = {
  potentialXp(priority: Priority, hasDueDate: boolean): number {
    return XP_BASE + PRIORITY_BONUS[priority] + (hasDueDate ? ON_TIME_BONUS : 0)
  }
}
