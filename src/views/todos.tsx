import { useState } from 'react'
import { CheckCircle2, Circle, Calendar, Tag, ChevronDown, ChevronRight } from 'lucide-react'
import { useLiveState } from '@/hooks/use-live-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import type { Todo } from '../../server/types'

function TodoCard({ todo }: { todo: Todo }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="transition-colors hover:border-zinc-600">
      <CardContent className="p-4">
        <button
          className="flex w-full items-start gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {todo.status === 'done' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <Circle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium">{todo.title}</h3>
              {expanded ? (
                <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {todo.date}
              </span>
              <Badge variant="secondary" className="text-xs">
                {todo.area}
              </Badge>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-4 ml-8 space-y-3">
            {todo.problem && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Problem
                </h4>
                <p className="text-sm text-foreground/90">{todo.problem}</p>
              </div>
            )}
            {todo.solution && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Solution
                </h4>
                <p className="text-sm text-foreground/90">{todo.solution}</p>
              </div>
            )}
            {todo.body && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Details
                </h4>
                <Markdown content={todo.body} />
              </div>
            )}
            {todo.files && todo.files.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Related Files
                </h4>
                <ul className="space-y-0.5">
                  {todo.files.map((file, i) => (
                    <li key={i} className="text-xs font-mono text-muted-foreground">
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TodoGroup({ area, todos }: { area: string; todos: Todo[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Tag size={14} />
        {area} ({todos.length})
      </h3>
      <div className="space-y-2">
        {todos.map((todo) => (
          <TodoCard key={todo.slug} todo={todo} />
        ))}
      </div>
    </div>
  )
}

export function TodosView() {
  const { state, loading } = useLiveState()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (!state) return null

  const todos = state.todos ?? []
  const pending = todos.filter((t) => t.status === 'pending')
  const done = todos.filter((t) => t.status === 'done')

  // Group by area
  function groupByArea(items: Todo[]) {
    const grouped = new Map<string, Todo[]>()
    for (const todo of items) {
      const area = todo.area || 'Uncategorized'
      const existing = grouped.get(area) ?? []
      existing.push(todo)
      grouped.set(area, existing)
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
  }

  const pendingGroups = groupByArea(pending)
  const doneGroups = groupByArea(done)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pending.length} pending</span>
          <span className="text-border">|</span>
          <span>{done.length} done</span>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            Done ({done.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingGroups.length > 0 ? (
            <div className="space-y-6">
              {pendingGroups.map(([area, items]) => (
                <TodoGroup key={area} area={area} todos={items} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
              <h2 className="text-lg font-semibold">All caught up!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                No pending todos.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="done">
          {doneGroups.length > 0 ? (
            <div className="space-y-6">
              {doneGroups.map(([area, items]) => (
                <TodoGroup key={area} area={area} todos={items} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No completed todos yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
