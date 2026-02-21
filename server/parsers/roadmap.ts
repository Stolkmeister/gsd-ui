import type { Milestone } from "../types.ts"

interface RoadmapPhaseStub {
  number: number | string
  slug: string
  goal: string
  planCount: number
  planNames: string[]
}

interface RoadmapMilestone {
  version: string
  name: string
  phaseRange: string
  status: "shipped" | "in_progress" | "planned"
  category: "shipped" | "go_live_gate" | "post_launch"
  completed?: string
  phases: RoadmapPhaseStub[]
}

/**
 * Parse ROADMAP.md to extract milestones and their phase stubs.
 */
export function parseRoadmap(raw: string): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = []

  // Parse milestone list entries under ### Shipped, ### Go-Live Gate, ### Post-Launch
  const milestoneSections: Array<{
    category: "shipped" | "go_live_gate" | "post_launch"
    content: string
  }> = []

  const shippedMatch = raw.match(/### Shipped\n([\s\S]*?)(?=\n### |$)/)
  if (shippedMatch) {
    milestoneSections.push({
      category: "shipped",
      content: shippedMatch[1] ?? "",
    })
  }

  const goLiveMatch = raw.match(
    /### Go-Live Gate\n([\s\S]*?)(?=\n### (?!Phase)|$)/
  )
  if (goLiveMatch) {
    milestoneSections.push({
      category: "go_live_gate",
      content: goLiveMatch[1] ?? "",
    })
  }

  const postLaunchMatch = raw.match(
    /### Post-Launch\n([\s\S]*?)(?=\n## |$)/
  )
  if (postLaunchMatch) {
    milestoneSections.push({
      category: "post_launch",
      content: postLaunchMatch[1] ?? "",
    })
  }

  for (const section of milestoneSections) {
    // Match: - [x] **v1.0 Organization Activity Feed** - Phases 1-3 (shipped 2026-02-04)
    const entryRegex =
      /- \[([x ])\]\s*\*\*(\S+)\s+([^*]+)\*\*\s*-\s*(?:Phases?\s*)?([^\n(]+?)(?:\s*\((?:shipped\s*)?([^)]*)\))?\s*$/gm
    let match: RegExpExecArray | null
    while ((match = entryRegex.exec(section.content)) !== null) {
      const isChecked = (match[1] ?? "") === "x"
      const version = (match[2] ?? "").trim()
      const name = (match[3] ?? "").trim()
      const phaseRange = (match[4] ?? "").trim()
      const dateOrInfo = (match[5] ?? "").trim()

      let status: "shipped" | "in_progress" | "planned"
      if (isChecked) {
        status = "shipped"
      } else if (section.category === "go_live_gate") {
        status = "in_progress"
      } else {
        status = "planned"
      }

      milestones.push({
        version,
        name,
        phaseRange,
        status,
        category: section.category,
        completed: isChecked ? dateOrInfo : undefined,
        phases: [],
      })
    }
  }

  // Parse <details> blocks for phase information within each milestone
  const detailsRegex =
    /<details>\s*<summary>([^<]+)<\/summary>([\s\S]*?)<\/details>/g
  let detailsMatch: RegExpExecArray | null
  while ((detailsMatch = detailsRegex.exec(raw)) !== null) {
    const summaryText = (detailsMatch[1] ?? "").trim()
    const detailsBody = detailsMatch[2] ?? ""

    // Extract version from summary
    const versionMatch = summaryText.match(/^(v[\d.]+)/)
    if (!versionMatch) continue
    const version = versionMatch[1] ?? ""

    // Find corresponding milestone
    const milestone = milestones.find((m) => m.version === version)
    if (!milestone) continue

    // Parse phases within this details block
    const phaseRegex =
      /### Phase ([\d.]+)(?:\.\d+)?:?\s*([^\n]+)\n([\s\S]*?)(?=\n### Phase |\n---|\n$|$)/g
    let phaseMatch: RegExpExecArray | null
    while ((phaseMatch = phaseRegex.exec(detailsBody)) !== null) {
      const phaseNum = (phaseMatch[1] ?? "").trim()
      const phaseNameRaw = (phaseMatch[2] ?? "").trim()
      const phaseBody = phaseMatch[3] ?? ""

      const goalMatch = phaseBody.match(/\*\*Goal\*\*:\s*(.+)/)
      const goal = (goalMatch?.[1] ?? "").trim()

      // Count plans
      const planLines = phaseBody.match(
        /- \[[ x]\]\s*[\d.]+-\d+-PLAN\.md/g
      )
      const planCount = planLines?.length ?? 0

      // Get plan names
      const planNames: string[] = []
      const planLineRegex =
        /- \[[ x]\]\s*([\d.]+-\d+-PLAN\.md)\s*(?:--?\s*)?(.+)?/g
      let planLineMatch: RegExpExecArray | null
      while ((planLineMatch = planLineRegex.exec(phaseBody)) !== null) {
        const desc = (planLineMatch[2] ?? planLineMatch[1] ?? "").trim()
        planNames.push(desc)
      }

      const slug = phaseNameRaw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      milestone.phases.push({
        number: phaseNum.includes(".")
          ? phaseNum
          : parseInt(phaseNum, 10),
        slug,
        goal,
        planCount,
        planNames,
      })
    }
  }

  // Also parse non-details phase blocks (for current/future milestones)
  const nonDetailsPhases =
    /### Phase ([\d.]+):?\s*([^\n]+)\n([\s\S]*?)(?=\n### Phase |\n### v|\n## |$)/g
  let ndMatch: RegExpExecArray | null
  while ((ndMatch = nonDetailsPhases.exec(raw)) !== null) {
    const phaseNum = (ndMatch[1] ?? "").trim()
    const phaseNameRaw = (ndMatch[2] ?? "").trim()
    const phaseBody = ndMatch[3] ?? ""

    // Check this isn't inside a <details> block
    const beforeText = raw.substring(0, ndMatch.index)
    const lastDetailsOpen = beforeText.lastIndexOf("<details>")
    const lastDetailsClose = beforeText.lastIndexOf("</details>")
    if (lastDetailsOpen > lastDetailsClose) continue

    const goalMatch = phaseBody.match(/\*\*Goal\*\*:\s*(.+)/)
    const goal = (goalMatch?.[1] ?? "").trim()

    const planLines = phaseBody.match(
      /- \[[ x]\]\s*[\d.]+-\d+-PLAN\.md/g
    )
    const planCount = planLines?.length ?? 0

    const planNames: string[] = []
    const planLineRegex =
      /- \[[ x]\]\s*([\d.]+-\d+-PLAN\.md)\s*(?:--?\s*)?(.+)?/g
    let planLineMatch: RegExpExecArray | null
    while ((planLineMatch = planLineRegex.exec(phaseBody)) !== null) {
      const desc = (planLineMatch[2] ?? planLineMatch[1] ?? "").trim()
      planNames.push(desc)
    }

    const slug = phaseNameRaw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Find which milestone this phase belongs to by matching phase number
    const phaseNumVal = parseFloat(phaseNum)
    for (const milestone of milestones) {
      const rangeMatch = milestone.phaseRange.match(
        /(\d+)(?:\s*[-\u2013]\s*(\d+))?/
      )
      if (!rangeMatch) continue
      const rangeStart = parseInt(rangeMatch[1] ?? "0", 10)
      const rangeEnd = rangeMatch[2]
        ? parseInt(rangeMatch[2], 10)
        : rangeStart
      if (phaseNumVal >= rangeStart && phaseNumVal <= rangeEnd) {
        milestone.phases.push({
          number: phaseNum.includes(".")
            ? phaseNum
            : parseInt(phaseNum, 10),
          slug,
          goal,
          planCount,
          planNames,
        })
        break
      }
    }
  }

  return milestones
}

/**
 * Convert roadmap milestones into the full Milestone type (minus filesystem phases).
 */
export function roadmapMilestonesToMilestones(
  roadmapMilestones: RoadmapMilestone[]
): Milestone[] {
  return roadmapMilestones.map((rm) => ({
    version: rm.version,
    name: rm.name,
    phaseRange: rm.phaseRange,
    status: rm.status,
    category: rm.category,
    completed: rm.completed,
    planCount: rm.phases.reduce((sum, p) => sum + p.planCount, 0),
    phases: [], // populated later from filesystem
  }))
}
