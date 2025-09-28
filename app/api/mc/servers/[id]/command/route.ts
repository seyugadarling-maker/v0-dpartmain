import type { NextRequest } from "next/server"
import { upstream } from "../../../../mc/_client"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const res = await upstream(`/servers/${params.id}/command`, { method: "POST", body: JSON.stringify(body) })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  })
}
