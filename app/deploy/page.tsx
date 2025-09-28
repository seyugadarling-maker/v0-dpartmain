"use client"

import { useRouter } from "next/navigation"
import CreateServerWizard, { type CreateServerPayload } from "@/components/dashboard/create-server-wizard"
import { toast } from "sonner"

export default function DeployPage() {
  const router = useRouter()

  async function onComplete(payload: CreateServerPayload) {
    // Map wizard payload → external API schema (match user's example)
    const distro = payload.edition === "java" ? payload.java?.distro || "vanilla" : "vanilla"
    const version = payload.edition === "java" ? payload.java?.version : payload.bedrock?.version

    if (!version) {
      toast.error("Please select a valid version for your edition.")
      throw new Error("Missing version")
    }

    const generatedName = `${distro}-${version.replace(/\./g, "-")}-test`
    const serverName = payload.name && payload.name.trim() ? payload.name : generatedName

    const body: any = {
      edition: distro, // fabric | paper | forge | vanilla
      version,
      motd: payload.motd || `✨ ${distro[0].toUpperCase()}${distro.slice(1)} ${version} Server by AuraDeploy ✨`,
      ram: payload.ramGB ?? 2,
      serverName,
      gamemode: payload.advanced?.gamemode ?? "survival",
      difficulty: payload.advanced?.difficulty ?? "normal",
      maxPlayers: payload.maxPlayers ?? 20,
      loadingScreen: {
        enabled: true,
        type: "percentage",
        percentage: 0,
      },
      onlineMode: false,
    }

    const res = await fetch("/api/mc/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const msg = await res.text()
      toast.error(`Deploy failed: ${msg}`)
      throw new Error(msg)
    }

    const data = await res.json()
    if (!data?.serverId) {
      toast.error("No serverId returned from deploy.")
      throw new Error("No serverId")
    }

    // Store for later (e.g., recovery, manage page deep link)
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastDeployedServerId", data.serverId)
        if (data.progressUrl) sessionStorage.setItem(`dp:progressUrl:${data.serverId}`, String(data.progressUrl))
        if (data.logsUrl) sessionStorage.setItem(`dp:logsUrl:${data.serverId}`, String(data.logsUrl))
        if (data.commandUrl) sessionStorage.setItem(`dp:commandUrl:${data.serverId}`, String(data.commandUrl))
      }
    } catch {
      /* ignore */
    }

    const q = new URLSearchParams({
      distro,
      version,
      name: serverName,
    }).toString()

    // Go to loading screen
    router.push(`/servers/${encodeURIComponent(data.serverId)}/deploying?${q}`)
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto rounded-lg border bg-card">
        <CreateServerWizard onCancel={() => router.push("/dashboard")} onComplete={onComplete} autoDeployOnReview />
      </div>
    </div>
  )
}
