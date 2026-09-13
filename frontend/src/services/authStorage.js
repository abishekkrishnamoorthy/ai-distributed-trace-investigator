const AUTH_STORAGE_KEY = 'traceInvestigatorAuth'

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = token.split('.')
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = window.atob(normalizedPayload)

    return JSON.parse(decodedPayload)
  } catch {
    return null
  }
}

const getTokenExpiresAt = (token) => {
  const payload = decodeJwtPayload(token)

  if (!payload?.exp) {
    return null
  }

  return payload.exp * 1000
}

export const clearAuthSession = () => {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

export const saveAuthSession = ({ token, user }) => {
  const expiresAt = getTokenExpiresAt(token)
  const session = {
    token,
    user,
    expiresAt,
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))

  return session
}

export const getAuthSession = () => {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY))

    if (!session?.token || !session?.expiresAt || Date.now() >= session.expiresAt) {
      clearAuthSession()
      return null
    }

    return session
  } catch {
    clearAuthSession()
    return null
  }
}

export const getAuthToken = () => getAuthSession()?.token || null
