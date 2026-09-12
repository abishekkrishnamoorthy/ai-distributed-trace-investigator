import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AIInsightsPage } from '../pages/AIInsights/AIInsightsPage'
import { ComparePage } from '../pages/Compare/ComparePage'
import { TraceDetailPage } from '../pages/TraceDetail/TraceDetailPage'
import { TracesPage } from '../pages/Traces/TracesPage'

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/traces" replace />} />
        <Route path="/traces" element={<TracesPage />} />
        <Route path="/traces/:traceId" element={<TraceDetailPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/traces" replace />} />
    </Routes>
  </BrowserRouter>
)
