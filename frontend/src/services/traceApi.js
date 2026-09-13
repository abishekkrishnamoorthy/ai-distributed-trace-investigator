import { apiClient } from './apiClient'

export const traceApi = {
  getTraceStats: () => apiClient.get('/api/traces/stats'),
  getTraces: (params) => apiClient.get('/api/traces', params),
  aiSearchTraces: (query, page, limit) => apiClient.post('/api/traces/ai-search', { query, page, limit }),
  compareTraces: (traceIds) => apiClient.post('/api/traces/compare', { traceIds }),
  getTraceById: (traceId) => apiClient.get(`/api/traces/${encodeURIComponent(traceId)}`),
  analyzeTraces: (traceIds) => apiClient.post('/api/traces/analyze', { traceIds }),
  getServices: () => apiClient.get('/api/services'),
}
