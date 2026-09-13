import { traceApi } from './traceApi'

export const aiInsightsService = {
  analyzeSelectedTraces: (traceIds) => traceApi.analyzeTraces(traceIds),
  getTraceDetails: async (traceIds) => {
    const responses = await Promise.allSettled(traceIds.map((traceId) => traceApi.getTraceById(traceId)))

    return responses.map((response, index) => ({
      traceId: traceIds[index],
      trace: response.status === 'fulfilled' ? response.value?.data : null,
      error: response.status === 'rejected',
    }))
  },
}
