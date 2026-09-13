import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AuthProvider } from '../contexts/AuthProvider'
import { useAuth } from '../hooks/useAuth'
import { AIInsightsPage } from '../pages/AIInsights/AIInsightsPage'
import { ComparePage } from '../pages/Compare/ComparePage'
import { LoginPage } from '../pages/Login/LoginPage'
import { TraceDetailPage } from '../pages/TraceDetail/TraceDetailPage'
import { TracesPage } from '../pages/Traces/TracesPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export const AppRoutes = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={(
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="/traces" replace />} />
          <Route path="/traces" element={<TracesPage />} />
          <Route path="/traces/:traceId" element={<TraceDetailPage />} />
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/traces" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)
