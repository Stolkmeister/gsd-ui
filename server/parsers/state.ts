import type { ProjectState } from "../types.ts"

/**
 * Parse STATE.md from a .planning/ directory.
 *
 * Extracts:
 * - Current phase position from "Phase: NN of NN (Name)"
 * - Progress percentage from "Progress: vX.X [##########..........] NN%"
 * - Milestone name from "Progress: vX.X"
 * - Status from "Status: ..." line
 * - Last activity from "Last activity: ..." line
 * - Velocity stats (total plans, avg duration, total duration)
 * - Phase metrics table
 * - Decisions list
 * - Blockers
 * - Session continuity info
 */
export function parseState(raw: string): ProjectState | null {
  try {
    // Phase position: "Phase: 41 of 45 (Auth Frontend App)"
    const phaseMatch = raw.match(
      /Phase:\s*(\d+)\s*of\s*(\d+)\s*(?:\(([^)]+)\))?/
    )
    const currentPhase = phaseMatch
      ? parseInt(phaseMatch[1] ?? "0", 10)
      : 0
    const totalPhases = phaseMatch
      ? parseInt(phaseMatch[2] ?? "0", 10)
      : 0
    const phaseName = (phaseMatch?.[3] ?? "").trim()

    // Status line
    const statusMatch = raw.match(/^Status:\s*(.+)$/m)
    const status = (statusMatch?.[1] ?? "").trim()

    // Last activity line
    const lastActivityMatch = raw.match(/^Last activity:\s*(.+)$/m)
    const lastActivity = (lastActivityMatch?.[1] ?? "").trim()

    // Progress bar: "Progress: v1.8 [##########..........] 50%"
    const progressMatch = raw.match(
      /Progress:\s*(v[\d.]+)\s*\[.*?\]\s*(\d+)%/
    )
    const milestoneName = (progressMatch?.[1] ?? "").trim()
    const progressPercent = progressMatch
      ? parseInt(progressMatch[2] ?? "0", 10)
      : 0

    // Velocity stats
    const totalPlansMatch = raw.match(
      /Total plans completed:\s*(\d+)/
    )
    const avgDurationMatch = raw.match(
      /Average duration:\s*(\d+)\s*min/
    )
    const totalDurationMatch = raw.match(
      /Total execution time:\s*(\d+)\s*min/
    )

    const velocity = {
      totalPlans: totalPlansMatch
        ? parseInt(totalPlansMatch[1] ?? "0", 10)
        : 0,
      avgDuration: avgDurationMatch
        ? parseInt(avgDurationMatch[1] ?? "0", 10)
        : 0,
      totalDuration: totalDurationMatch
        ? parseInt(totalDurationMatch[1] ?? "0", 10)
        : 0,
    }

    // Phase metrics table
    // | Phase | Plans | Total | Avg/Plan |
    // |-------|-------|-------|----------|
    // | 01-core-endpoint | 1 | 7 min | 7 min |
    const phaseMetrics: ProjectState["phaseMetrics"] = []
    const tableRegex =
      /\|\s*([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)*)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*min\s*\|\s*(\d+)\s*min\s*\|/g
    let tableMatch: RegExpExecArray | null
    while ((tableMatch = tableRegex.exec(raw)) !== null) {
      const pName = (tableMatch[1] ?? "").trim()
      // Skip header rows
      if (pName === "Phase" || pName.startsWith("---")) continue
      phaseMetrics.push({
        phase: pName,
        plans: parseInt(tableMatch[2] ?? "0", 10),
        totalMinutes: parseInt(tableMatch[3] ?? "0", 10),
        avgPerPlan: parseInt(tableMatch[4] ?? "0", 10),
      })
    }

    // Decisions - extract bullet points under "### Decisions"
    const decisions: string[] = []
    const decisionsSection = raw.match(
      /### Decisions\n\n([\s\S]*?)(?=\n###|\n## |$)/
    )
    if (decisionsSection) {
      const lines = (decisionsSection[1] ?? "").split("\n")
      for (const line of lines) {
        const bulletMatch = line.match(/^-\s+(.+)/)
        if (bulletMatch) {
          decisions.push((bulletMatch[1] ?? "").trim())
        }
      }
    }

    // Blockers - extract from "### Blockers/Concerns"
    const blockers: string[] = []
    const blockersSection = raw.match(
      /### Blockers\/Concerns\n\n([\s\S]*?)(?=\n###|\n## |$)/
    )
    if (blockersSection) {
      const content = (blockersSection[1] ?? "").trim()
      if (
        content.toLowerCase() !== "none." &&
        content.toLowerCase() !== "none"
      ) {
        const lines = content.split("\n")
        for (const line of lines) {
          const bulletMatch = line.match(/^-\s+(.+)/)
          if (bulletMatch) {
            blockers.push((bulletMatch[1] ?? "").trim())
          }
        }
      }
    }

    // Session continuity
    const lastSessionMatch = raw.match(/Last session:\s*(.+)$/m)
    const stoppedAtMatch = raw.match(
      /Stopped at:\s*([\s\S]*?)(?=\n\n|$)/
    )

    const sessionContinuity = {
      lastSession: (lastSessionMatch?.[1] ?? "").trim(),
      stoppedAt: (stoppedAtMatch?.[1] ?? "").trim(),
    }

    return {
      currentPhase,
      totalPhases,
      phaseName,
      status,
      lastActivity,
      progressPercent,
      milestoneName,
      velocity,
      phaseMetrics,
      decisions,
      blockers,
      sessionContinuity,
    }
  } catch {
    return null
  }
}
