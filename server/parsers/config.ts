import type { ProjectConfig } from "../types.ts"

/**
 * Parse config.json from a .planning/ directory.
 *
 * Expected format:
 * {
 *   "mode": "yolo",
 *   "depth": "standard",
 *   "parallelization": true,
 *   "commit_docs": true,
 *   "model_profile": "quality",
 *   "workflow": { "research": true, "plan_check": true, "verifier": true },
 *   "git": { "branching_strategy": "milestone" },
 *   "created": "2026-01-20"
 * }
 */
export function parseConfig(raw: string): ProjectConfig | null {
  try {
    const json = JSON.parse(raw)

    return {
      mode: json.mode ?? "unknown",
      depth: json.depth ?? "standard",
      parallelization: json.parallelization ?? false,
      commit_docs: json.commit_docs ?? false,
      model_profile: json.model_profile ?? "unknown",
      workflow: {
        research: json.workflow?.research ?? false,
        plan_check: json.workflow?.plan_check ?? false,
        verifier: json.workflow?.verifier ?? false,
      },
      git: {
        branching_strategy: json.git?.branching_strategy ?? "unknown",
      },
      created: json.created ?? "",
    }
  } catch {
    return null
  }
}
