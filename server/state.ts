import { readdir, readFile, stat } from "node:fs/promises"
import { join, basename, relative, extname } from "node:path"
import type {
  GsdState,
  Phase,
  Plan,
  Milestone,
  Decision,
  SearchEntry,
  ResearchDocument,
  Todo,
  MarkdownDocument,
} from "./types.ts"
import { parseConfig } from "./parsers/config.ts"
import { parseState } from "./parsers/state.ts"
import { parseRoadmap, roadmapMilestonesToMilestones } from "./parsers/roadmap.ts"
import { parseRequirements } from "./parsers/requirements.ts"
import { parsePlan } from "./parsers/plan.ts"
import { parseSummary } from "./parsers/summary.ts"
import { parseVerification } from "./parsers/verification.ts"
import { parseTodo } from "./parsers/todo.ts"
import { parseMarkdown } from "./parsers/markdown.ts"

/**
 * Build the complete GsdState from a .planning/ directory.
 */
export async function buildInitialState(
  planningPath: string
): Promise<GsdState> {
  const projectPath = join(planningPath, "..")

  const state: GsdState = {
    projectPath,
    planningPath,
    config: null,
    state: null,
    projectDoc: null,
    milestones: [],
    currentMilestone: null,
    phases: [],
    requirements: [],
    todos: [],
    research: [],
    decisions: [],
    searchIndex: [],
  }

  // Parse top-level files in parallel
  const [configRaw, stateRaw, roadmapRaw, requirementsRaw, projectRaw] =
    await Promise.all([
      readFileSafe(join(planningPath, "config.json")),
      readFileSafe(join(planningPath, "STATE.md")),
      readFileSafe(join(planningPath, "ROADMAP.md")),
      readFileSafe(join(planningPath, "REQUIREMENTS.md")),
      readFileSafe(join(planningPath, "PROJECT.md")),
    ])

  if (configRaw) state.config = parseConfig(configRaw)
  if (stateRaw) state.state = parseState(stateRaw)
  if (requirementsRaw) state.requirements = parseRequirements(requirementsRaw)
  if (projectRaw) {
    state.projectDoc = parseMarkdown(
      projectRaw,
      "PROJECT.md",
      join(planningPath, "PROJECT.md")
    )
  }

  // Parse roadmap and create milestones
  let roadmapMilestones: Milestone[] = []
  if (roadmapRaw) {
    const parsed = parseRoadmap(roadmapRaw)
    roadmapMilestones = roadmapMilestonesToMilestones(parsed)
  }

  // Parse phases from filesystem
  const phasesDir = join(planningPath, "phases")
  state.phases = await parsePhases(phasesDir, planningPath)

  // Parse research documents
  state.research = await parseResearchDocs(planningPath)

  // Parse todos
  state.todos = await parseTodos(planningPath)

  // Assign phases to milestones
  state.milestones = assignPhasesToMilestones(
    roadmapMilestones,
    state.phases
  )

  // Determine current milestone
  if (state.state?.milestoneName) {
    state.currentMilestone =
      state.milestones.find(
        (m) => m.version === state.state?.milestoneName
      ) ?? null
  }

  // Cross-reference requirements to plans
  crossReferenceRequirements(state)

  // Extract decisions from summaries
  state.decisions = extractAllDecisions(state.phases)

  // Build search index
  state.searchIndex = buildSearchIndex(state)

  return state
}

/**
 * Incrementally update state for a file change event.
 * For simplicity, this does a targeted re-parse of the changed file
 * and updates the relevant portion of state.
 */
export async function updateStateForFile(
  state: GsdState,
  filePath: string,
  event: "add" | "change" | "unlink"
): Promise<void> {
  const rel = relative(state.planningPath, filePath)
  const fileName = basename(filePath)

  // Handle top-level files
  if (fileName === "config.json") {
    if (event === "unlink") {
      state.config = null
    } else {
      const raw = await readFileSafe(filePath)
      state.config = raw ? parseConfig(raw) : null
    }
    return
  }

  if (fileName === "STATE.md") {
    if (event === "unlink") {
      state.state = null
    } else {
      const raw = await readFileSafe(filePath)
      state.state = raw ? parseState(raw) : null
    }
    return
  }

  if (fileName === "PROJECT.md") {
    if (event === "unlink") {
      state.projectDoc = null
    } else {
      const raw = await readFileSafe(filePath)
      state.projectDoc = raw
        ? parseMarkdown(raw, "PROJECT.md", filePath)
        : null
    }
    return
  }

  if (fileName === "ROADMAP.md" || fileName === "REQUIREMENTS.md") {
    // Full rebuild for roadmap/requirements changes -- they affect milestones and cross-refs
    const rebuilt = await buildInitialState(state.planningPath)
    Object.assign(state, rebuilt)
    return
  }

  // Handle phase files
  if (rel.startsWith("phases/")) {
    // Re-parse all phases (simpler and safe for file adds/removes)
    const phasesDir = join(state.planningPath, "phases")
    state.phases = await parsePhases(phasesDir, state.planningPath)

    // Re-assign to milestones
    state.milestones = assignPhasesToMilestones(
      state.milestones.map((m) => ({ ...m, phases: [] })),
      state.phases
    )

    // Re-extract decisions
    state.decisions = extractAllDecisions(state.phases)

    // Update current milestone
    if (state.state?.milestoneName) {
      state.currentMilestone =
        state.milestones.find(
          (m) => m.version === state.state?.milestoneName
        ) ?? null
    }

    crossReferenceRequirements(state)
    state.searchIndex = buildSearchIndex(state)
    return
  }

  // Handle todo files
  if (rel.startsWith("todos/")) {
    state.todos = await parseTodos(state.planningPath)
    state.searchIndex = buildSearchIndex(state)
    return
  }

  // Handle research files
  if (rel.startsWith("research/")) {
    state.research = await parseResearchDocs(state.planningPath)
    state.searchIndex = buildSearchIndex(state)
    return
  }
}

// ---- Internal helpers ----

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8")
  } catch {
    return null
  }
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isDirectory()
  } catch {
    return false
  }
}

/**
 * Parse all phase directories under phases/.
 * Handles naming patterns:
 * - "01-core-endpoint"
 * - "07.1-api-response-consistency"
 * - "phase-41"
 */
async function parsePhases(
  phasesDir: string,
  planningPath: string
): Promise<Phase[]> {
  if (!(await dirExists(phasesDir))) return []

  const entries = await readdir(phasesDir, { withFileTypes: true })
  const phaseDirs = entries.filter((e) => e.isDirectory())

  const phases: Phase[] = []

  for (const dir of phaseDirs) {
    const dirPath = join(phasesDir, dir.name)
    const phase = await parsePhaseDirectory(dir.name, dirPath, planningPath)
    if (phase) phases.push(phase)
  }

  // Sort by phase number
  phases.sort((a, b) => {
    const numA = typeof a.number === "number" ? a.number : parseFloat(String(a.number))
    const numB = typeof b.number === "number" ? b.number : parseFloat(String(b.number))
    return numA - numB
  })

  return phases
}

async function parsePhaseDirectory(
  dirName: string,
  dirPath: string,
  planningPath: string
): Promise<Phase | null> {
  // Extract phase number and slug from directory name
  // "01-core-endpoint" -> number=1, slug="core-endpoint"
  // "07.1-api-response-consistency" -> number="7.1", slug="api-response-consistency"
  // "phase-41" -> number=41, slug=""
  let phaseNumber: number | string = 0
  let slug = ""

  const phaseNNMatch = dirName.match(/^phase-(\d+)$/)
  const numberedMatch = dirName.match(/^(\d+(?:\.\d+)?)-(.+)$/)

  if (phaseNNMatch) {
    phaseNumber = parseInt(phaseNNMatch[1] ?? "0", 10)
    slug = ""
  } else if (numberedMatch) {
    const numStr = numberedMatch[1] ?? "0"
    phaseNumber = numStr.includes(".")
      ? numStr
      : parseInt(numStr, 10)
    slug = numberedMatch[2] ?? ""
  } else {
    // Unknown naming format -- skip
    return null
  }

  // Read all files in the phase directory
  let files: string[] = []
  try {
    const entries = await readdir(dirPath)
    files = entries.filter((f) => f.endsWith(".md"))
  } catch {
    return null
  }

  const plans: Plan[] = []
  let research: MarkdownDocument | undefined
  let context: MarkdownDocument | undefined
  let uat: MarkdownDocument | undefined
  let verification = undefined

  // Prefix for matching files: "03" for "03-enrichment-and-pagination", "43" for "phase-43"
  const phasePrefix = String(
    typeof phaseNumber === "number" ? phaseNumber : phaseNumber
  ).replace(".", "")

  for (const file of files) {
    const filePath = join(dirPath, file)
    const raw = await readFileSafe(filePath)
    if (!raw) continue

    if (file.match(/-PLAN\.md$/i)) {
      // Plan file: 03-01-PLAN.md, 43-01-PLAN.md
      const plan = parsePlan(raw, file, filePath)
      plans.push(plan)
    } else if (file.match(/-SUMMARY\.md$/i)) {
      // Summary file: 03-01-SUMMARY.md
      const summary = parseSummary(raw, file)
      // Match summary to plan by plan number
      const planNumMatch = file.match(/(\d+)-(\d+)-SUMMARY/i)
      if (planNumMatch) {
        const planNum = parseInt(planNumMatch[2] ?? "0", 10)
        const matchingPlan = plans.find((p) => p.planNumber === planNum)
        if (matchingPlan) {
          matchingPlan.summary = summary
          matchingPlan.status = "complete"
        }
      }
    } else if (file.match(/-VERIFICATION\.md$/i)) {
      // Verification file: 03-VERIFICATION.md
      verification = parseVerification(raw)
    } else if (file.match(/-RESEARCH\.md$/i)) {
      // Research file: 03-RESEARCH.md
      research = parseMarkdown(raw, file, filePath)
    } else if (file.match(/-CONTEXT\.md$/i)) {
      // Context file: 03-CONTEXT.md
      context = parseMarkdown(raw, file, filePath)
    } else if (file.match(/-UAT\.md$/i)) {
      // UAT file: 03-UAT.md
      uat = parseMarkdown(raw, file, filePath)
    }
  }

  // Sort plans by plan number
  plans.sort((a, b) => a.planNumber - b.planNumber)

  // Second pass: match summaries that weren't matched in first pass
  // (happens when summaries are parsed before their corresponding plans)
  for (const file of files) {
    if (!file.match(/-SUMMARY\.md$/i)) continue
    const planNumMatch = file.match(/(\d+)-(\d+)-SUMMARY/i)
    if (!planNumMatch) continue
    const planNum = parseInt(planNumMatch[2] ?? "0", 10)
    const matchingPlan = plans.find((p) => p.planNumber === planNum)
    if (matchingPlan && !matchingPlan.summary) {
      const filePath = join(dirPath, file)
      const raw = await readFileSafe(filePath)
      if (raw) {
        matchingPlan.summary = parseSummary(raw, file)
        matchingPlan.status = "complete"
      }
    }
  }

  // Derive phase status
  const phaseStatus = derivePhaseStatus(plans, verification, research)

  // Calculate metrics from state.md phase metrics table (or from plan data)
  const planCount = plans.length
  const metrics =
    planCount > 0
      ? {
          planCount,
          totalMinutes: 0,
          avgPerPlan: 0,
        }
      : undefined

  // Determine milestone from plan frontmatter or directory path
  const milestone = "" // Will be assigned by assignPhasesToMilestones

  return {
    number: phaseNumber,
    slug,
    dirName,
    dirPath,
    goal: "", // Will be enriched from roadmap
    milestone,
    status: phaseStatus,
    plans,
    research,
    context,
    uat,
    verification,
    metrics,
  }
}

function derivePhaseStatus(
  plans: Plan[],
  verification: Phase["verification"],
  research: MarkdownDocument | undefined
): Phase["status"] {
  if (verification) return "verified"
  if (plans.length > 0 && plans.every((p) => p.summary)) return "summarized"
  if (plans.length > 0 && plans.some((p) => p.summary)) return "executing"
  if (research) return "researched"
  return "planned"
}

/**
 * Assign filesystem Phase objects into milestones based on phase number ranges.
 */
function assignPhasesToMilestones(
  milestones: Milestone[],
  phases: Phase[]
): Milestone[] {
  for (const milestone of milestones) {
    milestone.phases = []

    // Parse phase range: "Phases 1-3", "Phase 4", "Phases 40-45"
    const rangeMatch = milestone.phaseRange.match(
      /(\d+)(?:\s*[-–]\s*(\d+))?/
    )
    if (!rangeMatch) continue

    const rangeStart = parseInt(rangeMatch[1] ?? "0", 10)
    const rangeEnd = rangeMatch[2]
      ? parseInt(rangeMatch[2], 10)
      : rangeStart

    for (const phase of phases) {
      const phaseNum =
        typeof phase.number === "number"
          ? phase.number
          : parseFloat(String(phase.number))
      if (phaseNum >= rangeStart && phaseNum <= rangeEnd) {
        phase.milestone = milestone.version
        milestone.phases.push(phase)
      }
    }
  }

  return milestones
}

/**
 * Cross-reference requirements to plans by matching plan frontmatter requirements field.
 */
function crossReferenceRequirements(state: GsdState): void {
  for (const req of state.requirements) {
    req.fulfilledByPlans = []
  }

  for (const phase of state.phases) {
    for (const plan of phase.plans) {
      if (plan.requirements.length === 0) continue
      for (const reqId of plan.requirements) {
        const req = state.requirements.find((r) => r.id === reqId)
        if (req) {
          const planRef = `${plan.phase}/${plan.fileName}`
          if (!req.fulfilledByPlans) req.fulfilledByPlans = []
          req.fulfilledByPlans.push(planRef)
        }
      }
    }
  }
}

/**
 * Extract all decisions from plan summaries across all phases.
 */
function extractAllDecisions(phases: Phase[]): Decision[] {
  const decisions: Decision[] = []

  for (const phase of phases) {
    for (const plan of phase.plans) {
      if (!plan.summary?.decisions) continue
      for (const d of plan.summary.decisions) {
        decisions.push({
          decision: d.decision,
          rationale: d.rationale,
          phase: plan.phase,
          plan: `${plan.phase}/${plan.fileName}`,
          source: plan.summary.oneLiner || plan.fileName,
        })
      }
    }
  }

  return decisions
}

/**
 * Parse all research documents from the research/ directory and phase research files.
 */
async function parseResearchDocs(
  planningPath: string
): Promise<ResearchDocument[]> {
  const docs: ResearchDocument[] = []

  // Standalone research in research/ directory
  const researchDir = join(planningPath, "research")
  if (await dirExists(researchDir)) {
    try {
      const files = await readdir(researchDir)
      for (const file of files) {
        if (!file.endsWith(".md")) continue
        const filePath = join(researchDir, file)
        const raw = await readFileSafe(filePath)
        if (!raw) continue
        const md = parseMarkdown(raw, file, filePath)
        const titleHeading = md.headings.find((h) => h.level === 1)
        docs.push({
          fileName: file,
          filePath,
          title: titleHeading?.text ?? file.replace(/\.md$/, ""),
          type: "standalone",
          body: md.body,
          headings: md.headings.map((h) => h.text),
        })
      }
    } catch {
      // research directory may not exist
    }
  }

  return docs
}

/**
 * Parse all todo files from todos/pending/ and todos/done/.
 */
async function parseTodos(planningPath: string): Promise<Todo[]> {
  const todos: Todo[] = []

  for (const status of ["pending", "done"] as const) {
    const dir = join(planningPath, "todos", status)
    if (!(await dirExists(dir))) continue

    try {
      const files = await readdir(dir)
      for (const file of files) {
        if (!file.endsWith(".md")) continue
        const filePath = join(dir, file)
        const raw = await readFileSafe(filePath)
        if (!raw) continue
        const todo = parseTodo(raw, file, status === "done")
        todos.push(todo)
      }
    } catch {
      // directory may not exist
    }
  }

  // Sort by date descending
  todos.sort((a, b) => b.date.localeCompare(a.date))

  return todos
}

/**
 * Build a search index from all parsed content for quick full-text search.
 */
function buildSearchIndex(state: GsdState): SearchEntry[] {
  const entries: SearchEntry[] = []

  // Index plans
  for (const phase of state.phases) {
    for (const plan of phase.plans) {
      const content = [
        plan.objective ?? "",
        plan.context ?? "",
        plan.tasks ?? "",
        plan.mustHaves.truths.join(" "),
        plan.filesModified.join(" "),
        plan.requirements.join(" "),
      ].join(" ")

      entries.push({
        title: `Plan ${plan.planNumber}: ${plan.objective?.substring(0, 80) ?? plan.fileName}`,
        path: plan.filePath,
        type: "plan",
        phase: plan.phase,
        milestone: phase.milestone,
        content,
        preview: plan.objective?.substring(0, 200) ?? "",
      })
    }

    // Index summaries
    for (const plan of phase.plans) {
      if (!plan.summary) continue
      entries.push({
        title: `Summary: ${plan.summary.oneLiner || plan.fileName}`,
        path: plan.filePath.replace("-PLAN.md", "-SUMMARY.md"),
        type: "summary",
        phase: plan.phase,
        milestone: phase.milestone,
        content: plan.summary.body,
        preview: plan.summary.oneLiner,
      })
    }

    // Index verification
    if (phase.verification) {
      entries.push({
        title: `Verification: Phase ${phase.number}`,
        path: join(phase.dirPath, `${phase.dirName.split("-")[0]}-VERIFICATION.md`),
        type: "verification",
        phase: phase.dirName,
        milestone: phase.milestone,
        content: phase.verification.body,
        preview: `${phase.verification.status} - ${phase.verification.score}`,
      })
    }
  }

  // Index research
  for (const doc of state.research) {
    entries.push({
      title: doc.title,
      path: doc.filePath,
      type: "research",
      content: doc.body,
      preview: doc.body.substring(0, 200),
    })
  }

  // Index todos
  for (const todo of state.todos) {
    entries.push({
      title: todo.title,
      path: join(
        state.planningPath,
        "todos",
        todo.status,
        todo.fileName
      ),
      type: "todo",
      content: `${todo.problem} ${todo.solution} ${todo.body}`,
      preview: todo.problem.substring(0, 200),
    })
  }

  // Index milestones
  for (const milestone of state.milestones) {
    entries.push({
      title: `${milestone.version} ${milestone.name}`,
      path: join(state.planningPath, "ROADMAP.md"),
      type: "milestone",
      milestone: milestone.version,
      content: `${milestone.name} ${milestone.phaseRange} ${milestone.status}`,
      preview: `${milestone.version} ${milestone.name} - ${milestone.status}`,
    })
  }

  // Index requirements
  for (const req of state.requirements) {
    entries.push({
      title: `${req.id}: ${req.description.substring(0, 80)}`,
      path: join(state.planningPath, "REQUIREMENTS.md"),
      type: "requirement",
      milestone: req.milestone,
      content: `${req.id} ${req.description} ${req.section}`,
      preview: req.description.substring(0, 200),
    })
  }

  // Index project doc
  if (state.projectDoc) {
    entries.push({
      title: "PROJECT.md",
      path: state.projectDoc.filePath,
      type: "document",
      content: state.projectDoc.body,
      preview: state.projectDoc.body.substring(0, 200),
    })
  }

  return entries
}
