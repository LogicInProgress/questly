// Same-origin fetch client. The session cookie rides along automatically
// (credentials: "same-origin"); writes send the CSRF token from the meta tag.

export class ApiError extends Error {
  status: number
  code?: string
  details: Record<string, unknown>

  constructor(status: number, message: string, code?: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

function csrfToken(): string {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ""
  )
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase()
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (!["GET", "HEAD"].includes(method)) {
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json")
    }
    headers.set("X-CSRF-Token", csrfToken())
  }

  const res = await fetch(`/api/v1${path}`, {
    ...options,
    method,
    headers,
    credentials: "same-origin"
  })

  if (res.status === 204) {
    return undefined as T
  }

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    const error = data?.error
    throw new ApiError(
      res.status,
      error?.message ?? res.statusText,
      error?.code,
      error ?? {}
    )
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" })
}
