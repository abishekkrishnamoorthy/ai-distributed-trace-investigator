import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_TRACE_STATS } from '../constants/trace'
import { traceApi } from '../services/traceApi'

export const useTraceStats = () => {
  const [stats, setStats] = useState(DEFAULT_TRACE_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      const result = await traceApi.getTraceStats()
      setStats({ ...DEFAULT_TRACE_STATS, ...result.data })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refetch()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refetch])

  return { stats, loading, error, refetch }
}
