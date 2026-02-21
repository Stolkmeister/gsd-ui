import { useMemo } from 'react'
import { Activity, Clock, TrendingUp, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useLiveState } from '@/hooks/use-live-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { GsdState } from '../../server/types'

interface PhaseMetric {
  phase: string
  plans: number
  totalMinutes: number
  avgPerPlan: number
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Activity
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-accent p-2.5">
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const chartTheme = {
  grid: '#27272a',
  text: '#a1a1aa',
  bar1: '#3b82f6',
  bar2: '#10b981',
  line: '#8b5cf6',
}

export function VelocityView() {
  const { state, loading } = useLiveState()

  const velocity = state?.state?.velocity
  const phaseMetrics = state?.state?.phaseMetrics ?? []

  // Build chart data from phaseMetrics
  const phaseChartData = useMemo(() => {
    return phaseMetrics.map((pm: PhaseMetric) => ({
      name: pm.phase,
      totalMinutes: pm.totalMinutes,
      avgPerPlan: pm.avgPerPlan,
      plans: pm.plans,
    }))
  }, [phaseMetrics])

  // Build plan-level chart from phases > plans > summaries
  const planChartData = useMemo(() => {
    if (!state?.phases) return []

    const data: Array<{ name: string; duration: number }> = []
    for (const phase of state.phases) {
      for (const plan of phase.plans ?? []) {
        if (plan.summary?.duration) {
          // Parse duration string like "42 minutes"
          const match = plan.summary.duration?.match(/(\d+)/)
          if (match?.[1]) {
            data.push({
              name: `P${phase.number}.${plan.planNumber}`,
              duration: parseInt(match[1], 10),
            })
          }
        }
      }
    }
    return data
  }, [state?.phases])

  // Cumulative progress
  const cumulativeData = useMemo(() => {
    if (!state?.phases) return []

    let total = 0
    const points: Array<{ phase: string; completed: number }> = []

    for (const phase of state.phases) {
      const completedPlans = phase.plans?.filter(
        (p) => p.status === 'complete' || (p.status as string) === 'summarized'
      ).length ?? 0
      total += completedPlans
      points.push({
        phase: `P${phase.number}`,
        completed: total,
      })
    }
    return points
  }, [state?.phases])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (!state) return null

  const totalPlans = velocity?.totalPlans ?? 0
  const avgDuration = velocity?.avgDuration
    ? `${Math.round(velocity.avgDuration)}m`
    : '--'
  const totalDuration = velocity?.totalDuration
    ? `${Math.round(velocity.totalDuration)}m`
    : '--'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Velocity</h1>

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Plans" value={totalPlans} icon={BarChart3} />
        <StatCard label="Avg Duration" value={avgDuration} icon={Clock} />
        <StatCard label="Total Duration" value={totalDuration} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Duration Chart */}
        {planChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Duration (minutes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={planChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Bar
                    dataKey="duration"
                    fill={chartTheme.bar1}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Phase Duration Chart */}
        {phaseChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phase Duration (minutes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={phaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: chartTheme.text }}
                  />
                  <Bar
                    dataKey="totalMinutes"
                    fill={chartTheme.bar1}
                    name="Total"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgPerPlan"
                    fill={chartTheme.bar2}
                    name="Avg/Plan"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cumulative Progress */}
        {cumulativeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cumulative Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="phase"
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={chartTheme.line}
                    strokeWidth={2}
                    dot={{ fill: chartTheme.line, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Plans per Phase */}
        {phaseChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plans per Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={phaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.text, fontSize: 11 }}
                    tickLine={{ stroke: chartTheme.grid }}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Bar
                    dataKey="plans"
                    fill={chartTheme.bar2}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No data state */}
      {phaseChartData.length === 0 && planChartData.length === 0 && (
        <div className="text-center py-12">
          <Activity size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No velocity data yet</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Velocity metrics will appear as plans are completed.
          </p>
        </div>
      )}
    </div>
  )
}
