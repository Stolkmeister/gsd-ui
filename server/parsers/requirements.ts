import type { Requirement } from "../types.ts"

/**
 * Parse REQUIREMENTS.md to extract individual requirement items.
 */
export function parseRequirements(raw: string): Requirement[] {
  const requirements: Requirement[] = []

  // Extract current milestone from header
  const headerMatch = raw.match(/# Requirements:.*?(v[\d.]+)/)
  const defaultMilestone = headerMatch?.[1] ?? ""

  // Build a traceability map: requirement ID -> phase
  const traceMap = new Map<string, string>()
  const traceSection = raw.match(
    /## Traceability\n([\s\S]*?)(?=\n## |$)/
  )
  if (traceSection) {
    const traceContent = traceSection[1] ?? ""
    const rowRegex =
      /\|\s*([A-Z]+-\d+)\s*\|\s*Phase\s*([\d.]+)\s*\|\s*(\w+)\s*\|/g
    let rowMatch: RegExpExecArray | null
    while ((rowMatch = rowRegex.exec(traceContent)) !== null) {
      const reqId = rowMatch[1] ?? ""
      const phaseNum = rowMatch[2] ?? ""
      traceMap.set(reqId, `Phase ${phaseNum}`)
    }
  }

  // Parse requirement entries
  let currentSection = ""

  const lines = raw.split("\n")
  for (const line of lines) {
    // Track sections: ### Brand Application
    const sectionMatch = line.match(/^###\s+(.+)$/)
    if (sectionMatch) {
      currentSection = (sectionMatch[1] ?? "").trim()
      continue
    }

    // Match requirement entries: - [x] **BRAND-01**: Description
    const reqMatch = line.match(
      /^- \[([x ])\]\s*\*\*([A-Z]+-\d+)\*\*:\s*(.+)$/
    )
    if (reqMatch) {
      const isComplete = (reqMatch[1] ?? "") === "x"
      const id = reqMatch[2] ?? ""
      const description = (reqMatch[3] ?? "").trim()

      requirements.push({
        id,
        description,
        status: isComplete ? "complete" : "pending",
        section: currentSection,
        milestone: defaultMilestone,
      })
    }
  }

  // Also parse "Future Requirements" and "Deferred Features" sections
  // These use - **ID**: Description (no checkbox)
  const futureSection = raw.match(
    /## Future Requirements\n([\s\S]*?)(?=\n## |$)/
  )
  if (futureSection) {
    const futureContent = futureSection[1] ?? ""
    let futureSubsection = "Future"
    for (const line of futureContent.split("\n")) {
      const subMatch = line.match(/^###\s+(.+)$/)
      if (subMatch) {
        futureSubsection = (subMatch[1] ?? "").trim()
        continue
      }
      const futureReqMatch = line.match(
        /^- \*\*([A-Z]+-\d+)\*\*:\s*(.+)$/
      )
      if (futureReqMatch) {
        requirements.push({
          id: futureReqMatch[1] ?? "",
          description: (futureReqMatch[2] ?? "").trim(),
          status: "pending",
          section: futureSubsection,
          milestone: "future",
        })
      }
    }
  }

  return requirements
}
