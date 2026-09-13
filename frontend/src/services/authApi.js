import { apiClient } from './apiClient'

export const authApi = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials, { auth: false }),
}
