import { useCallback, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export const AppLayout = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState('')
  const [navigationOpen, setNavigationOpen] = useState(false)

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <div className="app-shell">
      <Sidebar
        open={navigationOpen}
        onClose={() => setNavigationOpen(false)}
        onLogout={handleLogout}
        onNavigate={() => setNavigationOpen(false)}
        user={user}
      />
      <main className="main-area">
        <Topbar onOpenNavigation={() => setNavigationOpen(true)} />
        <Outlet context={{ showToast }} />
      </main>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
