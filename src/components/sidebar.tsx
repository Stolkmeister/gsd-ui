import { NavLink } from 'react-router'
import {
  Map,
  CheckSquare,
  Search,
  Scale,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useLiveState } from '@/hooks/use-live-state'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { to: '/', icon: Map, label: 'Roadmap' },
  { to: '/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/decisions', icon: Scale, label: 'Decisions' },
  { to: '/velocity', icon: Activity, label: 'Velocity' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { state } = useLiveState()
  const projectName = state?.config?.mode ?? 'GSD Project'

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Project name header */}
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">
            {projectName}
          </span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              )
            }
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status footer */}
      {!collapsed && state?.state && (
        <>
          <Separator />
          <div className="p-4">
            <div className="text-xs text-muted-foreground">
              <div>Phase {state.state.currentPhase} / {state.state.totalPhases}</div>
              <div className="mt-1 truncate">{state.state.status}</div>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
