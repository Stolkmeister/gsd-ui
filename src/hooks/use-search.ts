import { useCallback, useEffect, useRef, useState } from 'react'
import type { SearchEntry } from '../../server/types'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    setQuery(q)

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Debounce 250ms
    timerRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller

      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data: { results: SearchEntry[] }) => {
          setResults(data.results ?? [])
          setLoading(false)
        })
        .catch((err) => {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Search error:', err)
            setLoading(false)
          }
        })
    }, 250)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return { query, search, results, loading }
}
