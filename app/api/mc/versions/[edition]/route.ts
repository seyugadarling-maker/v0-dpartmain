import type { NextRequest } from "next/server"
import { upstream } from "../../_client"

export async function GET(_req: NextRequest, { params }: { params: { edition: string } }) {
  const res = await upstream(`/versions/${params.edition}`, { method: "GET" })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
