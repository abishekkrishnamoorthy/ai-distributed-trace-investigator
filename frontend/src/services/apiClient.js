const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||  'http://localhost:5005'

const buildUrl = (path, params = {}) => {
  const url = new URL(path, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}

export const apiClient = {
  get: async (path, params) => {
    const response = await fetch(buildUrl(path, params))

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response.json()
  },
}
