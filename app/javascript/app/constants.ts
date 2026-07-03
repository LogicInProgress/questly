import type { TagInput } from "./api/types"

export const AVATAR_EMOJIS = ["🦊", "🐼", "🦉", "🐺", "🦅", "🐯", "🦁", "🐢", "🐰", "🐸", "🐙", "🦄"]

export const EMBLEM_EMOJIS = ["🏔️", "🏕️", "🏖️", "🏠", "🎂", "🎯", "🗺️", "🏆", "🎒", "⚔️", "🚀", "🎪"]

export const TEMPLATES: { key: string; label: string; emoji: string; count: number }[] = [
  { key: "", label: "Blank quest", emoji: "📝", count: 0 },
  { key: "camping_trip", label: "Camping trip", emoji: "🏕️", count: 9 },
  { key: "beach_trip", label: "Beach trip", emoji: "🏖️", count: 8 },
  { key: "move_out", label: "Flat move-out", emoji: "🏠", count: 9 }
]

export const STARTER_TAG_PRESETS: TagInput[] = [
  { name: "Gear", emoji: "🎒", color: "#8b5cf6" },
  { name: "Permits", emoji: "📄", color: "#38bdf8" },
  { name: "Booking", emoji: "🏨", color: "#ffc94d" },
  { name: "Health", emoji: "💊", color: "#fb7185" },
  { name: "Food", emoji: "🍜", color: "#4ade80" }
]
