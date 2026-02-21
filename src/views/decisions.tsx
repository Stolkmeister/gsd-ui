import { useState, useMemo } from 'react'
import { Scale, Search, Filter } from 'lucide-react'
import { useLiveState } from '@/hooks/use-live-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Decision } from '../../server/types'

export function DecisionsView() {
  const { state, loading } = useLiveState()
  const [filter, setFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')

  const decisions = state?.decisions ?? []

  // Extract unique phases from decisions
  const uniquePhases = useMemo(() => {
    const phases = new Set<string>()
    decisions.forEach((d) => {
      if (d.phase) phases.add(d.phase)
    })
    return [...phases].sort()
  }, [decisions])

  // Filter decisions
  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      const matchesText =
        !filter ||
        d.decision.toLowerCase().includes(filter.toLowerCase()) ||
        d.rationale.toLowerCase().includes(filter.toLowerCase())
      const matchesPhase = phaseFilter === 'all' || d.phase === phaseFilter
      return matchesText && matchesPhase
    })
  }, [decisions, filter, phaseFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Decisions</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {decisions.length} decisions
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Filter decisions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Phases</option>
            {uniquePhases.map((phase) => (
              <option key={phase} value={phase}>
                Phase {phase}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decisions table */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Decision
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Rationale
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((decision, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium max-w-xs">
                        {decision.decision}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-md">
                        {decision.rationale}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {decision.phase && (
                            <Badge variant="secondary" className="text-xs">
                              P{decision.phase}
                            </Badge>
                          )}
                          {decision.plan && (
                            <Badge variant="outline" className="text-xs">
                              Plan {decision.plan}
                            </Badge>
                          )}
                          {decision.source && !decision.phase && !decision.plan && (
                            <span className="text-xs text-muted-foreground">
                              {decision.source}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <Scale size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No decisions found</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {filter || phaseFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'No decisions have been recorded yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
