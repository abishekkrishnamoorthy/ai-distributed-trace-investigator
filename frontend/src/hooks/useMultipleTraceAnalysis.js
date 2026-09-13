import { useCallback, useEffect, useMemo, useState } from 'react'
import { aiInsightsService } from '../services/aiInsightsService'
import { isValidAnalysis } from '../utils/aiAnalysis'

const MULTIPLE_ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000
const multipleAnalysisCache = new Map()

let currentSessionKey = null

const normalizeTraceIds = (traceIds = []) =>
  [...new Set(traceIds.filter((traceId) => typeof traceId === 'string' && traceId.trim()).map((traceId) => traceId.trim()))]

const createCacheKey = (traceIds = []) => `multiple-analysis:${[...traceIds].sort().join('|')}`

const getCachedSession = (cacheKey) => {
  if (!cacheKey) {
    return null
  }

  const cached = multipleAnalysisCache.get(cacheKey)

  if (!cached) {
    return null
  }

  if (Date.now() - cached.createdAt >= MULTIPLE_ANALYSIS_CACHE_TTL_MS) {
    multipleAnalysisCache.delete(cacheKey)
    if (currentSessionKey === cacheKey) {
      currentSessionKey = null
    }
    return null
  }

  return cached.session
}

export const clearCurrentMultipleAnalysisSession = () => {
  if (currentSessionKey) {
    multipleAnalysisCache.delete(currentSessionKey)
    currentSessionKey = null
  }
}

export const useMultipleTraceAnalysis = (initialTraceIds = []) => {
  const normalizedInitialTraceIds = useMemo(() => normalizeTraceIds(initialTraceIds), [initialTraceIds])
  const initialCacheKey = normalizedInitialTraceIds.length > 0
    ? createCacheKey(normalizedInitialTraceIds)
    : currentSessionKey
  const initialCachedSession = getCachedSession(initialCacheKey)

  const [selectedTraceIds, setSelectedTraceIds] = useState(
    () => initialCachedSession?.traceIds || normalizedInitialTraceIds,
  )
  const [traceDetails, setTraceDetails] = useState(() => initialCachedSession?.traceDetails || [])
  const [results, setResults] = useState(() => initialCachedSession?.results || [])
  const [analyzedAt, setAnalyzedAt] = useState(() => initialCachedSession?.analyzedAt || null)
  const [status, setStatus] = useState(() => (initialCachedSession ? 'success' : 'idle'))
  const [error, setError] = useState('')

  const cacheKey = selectedTraceIds.length > 0 ? createCacheKey(selectedTraceIds) : null
  const canAnalyze = selectedTraceIds.length >= 2 && status !== 'loading'

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextCacheKey = normalizedInitialTraceIds.length > 0
        ? createCacheKey(normalizedInitialTraceIds)
        : currentSessionKey
      const cachedSession = getCachedSession(nextCacheKey)

      setSelectedTraceIds(cachedSession?.traceIds || normalizedInitialTraceIds)
      setTraceDetails(cachedSession?.traceDetails || [])
      setResults(cachedSession?.results || [])
      setAnalyzedAt(cachedSession?.analyzedAt || null)
      setStatus(cachedSession ? 'success' : 'idle')
      setError('')
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [normalizedInitialTraceIds])

  const analyze = useCallback(async () => {
    if (!canAnalyze || !cacheKey) {
      return
    }

    const cachedSession = getCachedSession(cacheKey)

    if (cachedSession) {
      setTraceDetails(cachedSession.traceDetails)
      setResults(cachedSession.results)
      setAnalyzedAt(cachedSession.analyzedAt)
      setStatus('success')
      setError('')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const [detailResults, analysisResponse] = await Promise.all([
        aiInsightsService.getTraceDetails(selectedTraceIds),
        aiInsightsService.analyzeSelectedTraces(selectedTraceIds),
      ])
      const analysisByTraceId = new Map(
        (analysisResponse?.data || []).map((item) => [item?.traceId, item?.analysis]),
      )
      const nextResults = selectedTraceIds.map((traceId) => {
        const analysis = analysisByTraceId.get(traceId)

        if (!isValidAnalysis(analysis)) {
          return {
            traceId,
            status: 'error',
            error: 'Valid AI analysis was not returned for this trace.',
          }
        }

        return {
          traceId,
          status: 'success',
          analysis,
        }
      })
      const nextAnalyzedAt = new Date().toISOString()
      const session = {
        traceIds: selectedTraceIds,
        traceDetails: detailResults,
        results: nextResults,
        analyzedAt: nextAnalyzedAt,
      }

      multipleAnalysisCache.set(cacheKey, {
        session,
        createdAt: Date.now(),
      })
      currentSessionKey = cacheKey

      setTraceDetails(detailResults)
      setResults(nextResults)
      setAnalyzedAt(nextAnalyzedAt)
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Unable to analyze the selected traces right now. Please try again.')
    }
  }, [cacheKey, canAnalyze, selectedTraceIds])

  const reset = useCallback(() => {
    clearCurrentMultipleAnalysisSession()
    setSelectedTraceIds([])
    setTraceDetails([])
    setResults([])
    setAnalyzedAt(null)
    setStatus('idle')
    setError('')
  }, [])

  return {
    analyzedAt,
    analyze,
    cacheLifetimeMs: MULTIPLE_ANALYSIS_CACHE_TTL_MS,
    canAnalyze,
    error,
    results,
    reset,
    selectedTraceIds,
    status,
    traceDetails,
  }
}
