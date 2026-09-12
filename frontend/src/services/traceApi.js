import { apiClient } from './apiClient'

export const traceApi = {
  getTraceStats: () => apiClient.get('/api/traces/stats'),
  getTraces: (params) => apiClient.get('/api/traces', params),
  getTraceById: (traceId) => apiClient.get(`/api/traces/${encodeURIComponent(traceId)}`),
  getServices: () => apiClient.get('/api/services'),
}
