const BASE = process.env.MC_API_BASE || "http://194.238.16.252:3000/api"
const KEY = process.env.MC_API_KEY || "niggawhathappend87w3"

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
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    // Ensure we don't cache control-plane calls
    cache: "no-store",
  })
  return res
}

export function upstreamUrl(path: string) {
  return `${BASE}${path}`
}
