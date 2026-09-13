import { clearAuthSession, getAuthToken } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const buildUrl = (path, params = {}) => {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}

const isLocalOrPrivateHost = (hostname) => {
  const normalizedHost = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const octets = normalizedHost.split('.').map(Number)
  const isPrivateIPv4 =
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    )

  return (
    normalizedHost === 'localhost' ||
    normalizedHost === '::1' ||
    normalizedHost.endsWith('.localhost') ||
    normalizedHost.endsWith('.local') ||
    isPrivateIPv4
  )
}

const assertAllowedApiUrl = (url) => {
  if (typeof window === 'undefined') {
    return
  }

  const appHost = window.location.hostname

  if (!isLocalOrPrivateHost(appHost) && isLocalOrPrivateHost(url.hostname)) {
    throw new Error('Blocked request to a local or private API host from a public frontend origin')
  }
}

export const apiClient = {
  get: async (path, params, options) => {
    const url = buildUrl(path, params)
    assertAllowedApiUrl(url)

    const response = await fetch(url, {
      headers: buildHeaders(options),
    })

    await assertOkResponse(response)

    return response.json()
  },
  post: async (path, body, options) => {
    const url = buildUrl(path)
    assertAllowedApiUrl(url)

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(options),
      body: JSON.stringify(body),
    })

    await assertOkResponse(response)

    return response.json()
  },
}

const buildHeaders = (options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (options.auth !== false) {
    const token = getAuthToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

const getErrorMessage = async (response) => {
  try {
    const body = await response.json()

    return body?.error?.message || `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

const assertOkResponse = async (response) => {
  if (response.ok) {
    return
  }

  const message = await getErrorMessage(response)
  const error = new Error(message)
  error.status = response.status

  if (response.status === 401) {
    clearAuthSession()
    window.dispatchEvent(new Event('auth:unauthorized'))
  }

  throw error
}
