// Mirrors the server's leveling formula: threshold(n) = 50 * n * (n - 1).
export function xpThreshold(level: number): number {
  return 50 * level * (level - 1)
}

export function levelProgress(level: number, xpTotal: number): { percent: number; toNext: number; next: number } {
  const current = xpThreshold(level)
  const next = xpThreshold(level + 1)
  const span = next - current || 1
  const percent = Math.round(((xpTotal - current) / span) * 100)
  return { percent: Math.max(0, Math.min(100, percent)), toNext: Math.max(0, next - xpTotal), next }
}
