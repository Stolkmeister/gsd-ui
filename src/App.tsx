import { Routes, Route } from 'react-router'
import { StateProvider } from '@/lib/state-context'
import { Layout } from '@/components/layout'
import { RoadmapView } from '@/views/roadmap'
import { MilestoneView } from '@/views/milestone'
import { PhaseView } from '@/views/phase'
import { PlanView } from '@/views/plan'
import { DocumentView } from '@/views/document'
import { SearchView } from '@/views/search'
import { TodosView } from '@/views/todos'
import { DecisionsView } from '@/views/decisions'
import { VelocityView } from '@/views/velocity'

export function App() {
  return (
    <StateProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<RoadmapView />} />
          <Route path="/milestone/:version" element={<MilestoneView />} />
          <Route path="/phase/:number" element={<PhaseView />} />
          <Route path="/plan/:phase/:plan" element={<PlanView />} />
          <Route path="/document/*" element={<DocumentView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/todos" element={<TodosView />} />
          <Route path="/decisions" element={<DecisionsView />} />
          <Route path="/velocity" element={<VelocityView />} />
        </Routes>
      </Layout>
    </StateProvider>
  )
}
