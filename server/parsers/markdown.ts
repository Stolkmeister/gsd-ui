import type { MarkdownDocument } from "../types.ts"
import { parseFrontmatter } from "./frontmatter.ts"

/**
 * Parse a generic markdown file. Extracts:
 * - YAML frontmatter (if present)
 * - Headings with their levels
 * - Full body content
 */
export function parseMarkdown(
  raw: string,
  fileName: string,
  filePath: string
): MarkdownDocument {
  const { data, content } = parseFrontmatter(raw)

  const headings = extractHeadings(content)

  return {
    filePath,
    fileName,
    frontmatter: data,
    body: content,
    headings,
  }
}

/**
 * Extract all markdown headings from content.
 * Returns array of { level, text } where level is 1-6.
 */
export function extractHeadings(
  content: string
): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = []
  const regex = /^(#{1,6})\s+(.+)$/gm

  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    const hashes = match[1] ?? ""
    const text = match[2] ?? ""
    headings.push({
      level: hashes.length,
      text: text.trim(),
    })
  }

  return headings
}
