import { useCallback } from 'react'

export const AI_ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000

const analysisCache = new Map()

const getCachedEntry = (traceId) => {
  if (!traceId) {
    return null
  }

  const cachedEntry = analysisCache.get(traceId)

  if (!cachedEntry) {
    return null
  }

  if (Date.now() - cachedEntry.createdAt >= AI_ANALYSIS_CACHE_TTL_MS) {
    analysisCache.delete(traceId)
    return null
  }

  return cachedEntry
}

export const useAIAnalysisCache = () => {
  const getCachedAnalysis = useCallback((traceId) => getCachedEntry(traceId)?.analysis || null, [])

  const setCachedAnalysis = useCallback((traceId, analysis) => {
    if (!traceId || !analysis) {
      return
    }

    analysisCache.set(traceId, {
      analysis,
      createdAt: Date.now(),
    })
  }, [])

  const removeCachedAnalysis = useCallback((traceId) => {
    if (traceId) {
      analysisCache.delete(traceId)
    }
  }, [])

  return {
    cacheLifetimeMs: AI_ANALYSIS_CACHE_TTL_MS,
    getCachedAnalysis,
    removeCachedAnalysis,
    setCachedAnalysis,
  }
}
