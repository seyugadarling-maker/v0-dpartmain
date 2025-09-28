"use client"

import useSWR from "swr"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`)
    return r.json()
  })

export default function DeployingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const distro = search.get("distro") || undefined
  const version = search.get("version") || undefined
  const name = search.get("name") || undefined

  const { data, error } = useSWR<{ percent: number; message?: string; status?: string }>(
    `/api/mc/servers/${id}/progress`,
    fetcher,
    { refreshInterval: 2500 }, // poll every ~2.5s
  )

  const targetPercent = Number(data?.percent ?? 0)
  const apiStatus = data?.status
  const message = data?.message ?? "Preparing your server..."

  const [smoothPercent, setSmoothPercent] = useState(0)
  useEffect(() => {
    if (targetPercent < smoothPercent) return
    const step = () => {
      setSmoothPercent((p) => {
        if (p >= targetPercent) return p
        const delta = Math.max(1, Math.round((targetPercent - p) * 0.2))
        return Math.min(p + delta, targetPercent)
      })
    }
    const t = setInterval(step, 80)
    return () => clearInterval(t)
  }, [targetPercent, smoothPercent])

  const isDone = (apiStatus && apiStatus === "running") || targetPercent >= 100
  useEffect(() => {
    if (!isDone) return
    const t = setTimeout(() => router.push("/dashboard"), 1200)
    return () => clearTimeout(t)
  }, [isDone, router])

  const label = useMemo(() => {
    if (distro && version) {
      const pretty = distro[0].toUpperCase() + distro.slice(1)
      return `Deploying ${pretty} ${version} Server… (${Math.round(smoothPercent)}%)`
    }
    return `Deploying Server… (${Math.round(smoothPercent)}%)`
  }, [distro, version, smoothPercent])

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-xl rounded-lg border bg-card p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-balance">{isDone ? "Server Created!" : "Creating Server…"}</h1>
          <p className="text-sm text-muted-foreground">{label}</p>
          {name ? <p className="text-xs text-muted-foreground">Name: {name}</p> : null}
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {error.message || "Deployment failed. Please try again."}
          </div>
        ) : (
          <div className="space-y-3">
            <Progress value={Math.min(100, smoothPercent)} />
            <div className="text-right text-sm text-muted-foreground">{Math.min(100, Math.round(smoothPercent))}%</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {isDone ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-green-600"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Success! Redirecting…</span>
            </motion.div>
          ) : (
            <motion.div
              className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              aria-hidden
            />
          )}

          {isDone ? (
            <Button onClick={() => router.push("/dashboard")} className="bg-primary text-primary-foreground">
              Go to Dashboard
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
