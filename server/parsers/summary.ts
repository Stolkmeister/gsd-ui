import type { PlanSummary } from "../types.ts"
import { parseFrontmatter } from "./frontmatter.ts"

/**
 * Parse a SUMMARY.md file from a phase directory.
 */
export function parseSummary(raw: string, fileName: string): PlanSummary {
  const { data, content } = parseFrontmatter(raw)

  const body = content

  // Extract inline metadata
  const phase =
    String(data.phase ?? "") || (extractInline(body, "phase") ?? "")
  const plan =
    typeof data.plan === "number"
      ? data.plan
      : parseInt(extractInline(body, "plan") ?? "0", 10)
  const subsystem =
    String(data.subsystem ?? "") || (extractInline(body, "subsystem") ?? undefined)
  const tags = data.tags
    ? asStringArray(data.tags)
    : extractTagsList(body, "tags")

  // One-liner
  const oneLinerMatch = body.match(/\*\*One-liner:\*\*\s*(.+)/)
  const oneLiner = (oneLinerMatch?.[1] ?? "").trim()

  // Duration and completed from ## Metrics section or inline
  const durationMatch = body.match(/duration:\s*(.+?)$/m)
  const duration = (durationMatch?.[1] ?? "").trim()

  const completedMatch = body.match(/completed:\s*(.+?)$/m)
  const completed = (completedMatch?.[1] ?? "").trim()

  const startedMatch = body.match(/started:\s*(.+?)$/m)
  const started = (startedMatch?.[1] ?? "").trim()

  const statusMatch = body.match(/status:\s*(.+?)$/m)
  const status = (statusMatch?.[1] ?? "complete").trim()

  // Files created and modified
  const filesCreated = extractFileList(body, "Created")
  const filesModified = extractFileList(body, "Modified")

  // Decisions table
  const decisions = extractDecisionsTable(body)

  return {
    phase,
    plan,
    status,
    started,
    completed,
    duration,
    subsystem: subsystem || undefined,
    tags: tags.length > 0 ? tags : undefined,
    oneLiner,
    filesCreated,
    filesModified,
    decisions,
    body,
  }
}

function extractInline(body: string, key: string): string | null {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "m")
  const match = body.match(regex)
  return match ? (match[1] ?? "").trim() : null
}

function extractTagsList(body: string, key: string): string[] {
  const regex = new RegExp(`^${key}:\\s*\\[(.+)\\]$`, "m")
  const match = body.match(regex)
  if (!match) return []
  return (match[1] ?? "").split(",").map((s) => s.trim())
}

function asStringArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === "string") return [val]
  return []
}

function extractFileList(body: string, heading: string): string[] {
  const regex = new RegExp(
    `### ${heading}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`
  )
  const match = body.match(regex)
  if (!match) return []

  const files: string[] = []
  const content = match[1] ?? ""
  const lines = content.split("\n")
  for (const line of lines) {
    const fileMatch = line.match(/^- (.+)/)
    if (fileMatch) {
      files.push((fileMatch[1] ?? "").trim())
    }
  }
  return files
}

function extractDecisionsTable(
  body: string
): Array<{ decision: string; rationale: string }> {
  const decisions: Array<{ decision: string; rationale: string }> = []

  const sectionMatch = body.match(
    /## Decisions(?:\s+Made)?\n([\s\S]*?)(?=\n## |$)/
  )
  if (!sectionMatch) return decisions

  const sectionContent = sectionMatch[1] ?? ""

  // Parse markdown table rows: | Decision | Rationale |
  const rowRegex = /\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g
  let rowMatch: RegExpExecArray | null
  let headerSeen = false
  while ((rowMatch = rowRegex.exec(sectionContent)) !== null) {
    const col1 = (rowMatch[1] ?? "").trim()
    const col2 = (rowMatch[2] ?? "").trim()

    // Skip header and separator rows
    if (col1 === "Decision" || col1.startsWith("---")) {
      headerSeen = true
      continue
    }
    if (!headerSeen) continue
    if (col1.startsWith("---")) continue

    decisions.push({
      decision: col1,
      rationale: col2,
    })
  }

  return decisions
}
