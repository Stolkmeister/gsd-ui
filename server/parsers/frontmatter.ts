import matter from "gray-matter"

export interface ParsedFrontmatter {
  data: Record<string, unknown>
  content: string
}

/**
 * Parse YAML frontmatter from a markdown string using gray-matter.
 * Returns the parsed data and the remaining body content.
 * If no frontmatter is found, returns empty data and the full content.
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  try {
    const result = matter(raw, {
      engines: {
        javascript: () => { throw new Error("JS frontmatter is not supported") },
      },
    })
    return {
      data: result.data as Record<string, unknown>,
      content: result.content.trim(),
    }
  } catch {
    return {
      data: {},
      content: raw.trim(),
    }
  }
}
