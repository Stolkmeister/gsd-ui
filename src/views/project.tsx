import {
  Settings,
  AlertTriangle,
  Clock,
  GitBranch,
  Cpu,
  Layers,
  Zap,
  FlaskConical,
  ClipboardCheck,
  Shield,
} from 'lucide-react'
import { useLiveState } from '@/hooks/use-live-state'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/markdown'
import { Skeleton } from '@/components/ui/skeleton'

function ConfigCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Settings }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Icon size={16} className="shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function ProjectView() {
  const { state, loading } = useLiveState()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!state) return null

  const config = state.config
  const projectState = state.state
  const projectDoc = state.projectDoc
  const blockers = projectState?.blockers ?? []
  const continuity = projectState?.sessionContinuity

  const projectName =
    projectDoc?.headings?.find((h) => h.level === 1)?.text ??
    config?.mode ??
    'Project Overview'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{projectName}</h1>
        {projectState?.status && (
          <p className="text-sm text-muted-foreground mt-1">{projectState.status}</p>
        )}
      </div>

      {/* Config Grid */}
      {config && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Configuration
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ConfigCard label="Model Profile" value={config.model_profile} icon={Cpu} />
            <ConfigCard label="Project Mode" value={config.mode} icon={Layers} />
            <ConfigCard label="Depth" value={config.depth} icon={Settings} />
            <ConfigCard
              label="Parallelization"
              value={config.parallelization ? 'Enabled' : 'Disabled'}
              icon={Zap}
            />
            {config.git?.branching_strategy && (
              <ConfigCard label="Git Strategy" value={config.git.branching_strategy} icon={GitBranch} />
            )}
            {config.workflow && (
              <>
                <ConfigCard
                  label="Research"
                  value={config.workflow.research ? 'Enabled' : 'Disabled'}
                  icon={FlaskConical}
                />
                <ConfigCard
                  label="Plan Check"
                  value={config.workflow.plan_check ? 'Enabled' : 'Disabled'}
                  icon={ClipboardCheck}
                />
                <ConfigCard
                  label="Verifier"
                  value={config.workflow.verifier ? 'Enabled' : 'Disabled'}
                  icon={Shield}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            Blockers ({blockers.length})
          </h2>
          <div className="space-y-2">
            {blockers.map((blocker, i) => (
              <Card key={i} className="border-red-900/50 bg-red-950/20">
                <CardContent className="p-3">
                  <p className="text-sm text-red-300">{blocker}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Session Continuity */}
      {continuity && (continuity.lastSession || continuity.stoppedAt) && (
        <Card className="border-zinc-700">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
              <Clock size={12} />
              Session Continuity
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              {continuity.lastSession && (
                <div>
                  <span className="text-muted-foreground">Last session: </span>
                  <span className="text-foreground">{continuity.lastSession}</span>
                </div>
              )}
              {continuity.stoppedAt && (
                <div>
                  <span className="text-muted-foreground">Stopped at: </span>
                  <span className="text-foreground">{continuity.stoppedAt}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Description (from PROJECT.md) */}
      {projectDoc?.body && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            About
          </h2>
          <Card>
            <CardContent className="p-6">
              <Markdown content={projectDoc.body} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
