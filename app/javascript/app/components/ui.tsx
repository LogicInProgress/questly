import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "ghost" | "gold" | "danger"

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-violet to-[#6d3bd6] shadow-[0_10px_22px_-10px_rgba(139,92,246,.8)]",
  gold: "text-[#3a2a00] bg-gradient-to-br from-[#ffd873] to-gold shadow-[0_10px_22px_-10px_rgba(255,201,77,.7)]",
  ghost: "text-ink bg-surface2 border border-line",
  danger: "text-coral bg-surface2 border border-coral/40"
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-rs px-4 py-3 font-display text-[15px] font-semibold transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Screen({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className={`flex flex-1 flex-col ${className}`}>{children}</div>
    </div>
  )
}

export function ScreenHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {icon && (
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-gradient-to-br from-surface3 to-surface2 text-lg">
          {icon}
        </div>
      )}
    </div>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  error?: string | null
  invalid?: boolean
}

export function TextField({ label, icon, error, invalid, className = "", ...props }: FieldProps) {
  const showInvalid = Boolean(error) || Boolean(invalid)
  return (
    <label className="my-3 block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span
        className={`flex items-center gap-2.5 rounded-xl border bg-surface px-3 py-3 text-sm transition focus-within:border-violet focus-within:shadow-[0_0_0_3px_rgba(139,92,246,.22)] ${
          showInvalid ? "border-coral shadow-[0_0_0_3px_rgba(251,113,133,.2)]" : "border-line"
        }`}
      >
        {icon && <span className="text-[15px] opacity-80">{icon}</span>}
        <input
          className={`w-full bg-transparent text-ink placeholder:text-faint focus:outline-none ${className}`}
          {...props}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  )
}

export function EmojiPicker({
  options,
  value,
  onChange
}: {
  options: string[]
  value: string
  onChange: (emoji: string) => void
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`grid h-10 w-10 place-items-center rounded-xl border bg-surface text-xl transition ${
            value === emoji ? "border-violet shadow-[0_0_0_3px_rgba(139,92,246,.25)]" : "border-line"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-r border border-line bg-gradient-to-br from-surface2 to-surface p-4 ${className}`}
    >
      {children}
    </div>
  )
}

export function Pill({
  children,
  active = false,
  onClick
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-violet/40 bg-violet/15 text-violet-2"
          : "border-line bg-surface2 text-muted"
      }`}
    >
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-violet-2" />
    </div>
  )
}
