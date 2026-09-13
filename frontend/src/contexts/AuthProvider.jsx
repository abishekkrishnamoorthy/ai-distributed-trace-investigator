import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { authApi } from '../services/authApi'
import { clearAuthSession, getAuthSession, saveAuthSession } from '../services/authStorage'

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => getAuthSession())

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials)
    const nextSession = saveAuthSession(response.data)

    setSession(nextSession)

    return nextSession
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  useEffect(() => {
    if (!session?.expiresAt) {
      return undefined
    }

    const remainingTime = Math.max(session.expiresAt - Date.now(), 0)
    const timeoutId = window.setTimeout(() => {
      logout()
    }, remainingTime)

    return () => window.clearTimeout(timeoutId)
  }, [logout, session?.expiresAt])

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
