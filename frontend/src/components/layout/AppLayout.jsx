import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const AppLayout = () => {
  const [toast, setToast] = useState('')
  const [navigationOpen, setNavigationOpen] = useState(false)

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar
        open={navigationOpen}
        onClose={() => setNavigationOpen(false)}
        onNavigate={() => setNavigationOpen(false)}
      />
      <main className="main-area">
        <Outlet context={{ showToast }} />
      </main>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
