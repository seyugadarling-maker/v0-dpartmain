const BASE = (process.env.MC_API_BASE || process.env.MC_BASE_URL || "http://194.238.16.252:3000/api").replace(
  /\/+$/,
  "",
)
const KEY = process.env.MC_API_KEY

function assertKey() {
  if (!KEY) {
    console.error("[v0] MC_API_KEY is missing. Set it in Project Settings > Environment Variables.")
    throw new Response("Server misconfiguration: MC_API_KEY missing", { status: 500 })
  }
}

export async function upstream(path: string, init: RequestInit = {}) {
  assertKey()
  const headers = new Headers(init.headers || {})
  headers.set("x-api-key", KEY!)
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }
  // Ensure we don't cache control-plane calls
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`
  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })
  return res
}

export function upstreamUrl(path: string) {
  // Normalize returned path
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`
}
