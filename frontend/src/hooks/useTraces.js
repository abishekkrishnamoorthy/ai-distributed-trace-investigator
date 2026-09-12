import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_TRACE_PAGINATION } from '../constants/trace'
import { traceApi } from '../services/traceApi'

export const useTraces = (query) => {
  const [traces, setTraces] = useState([])
  const [pagination, setPagination] = useState(DEFAULT_TRACE_PAGINATION)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      const result = await traceApi.getTraces(query)
      setTraces(result.data || [])
      setPagination({
        ...DEFAULT_TRACE_PAGINATION,
        ...(result.pagination || {}),
        totalPages: result.pagination?.totalPages || 1,
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refetch()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refetch])

  return { traces, pagination, loading, error, refetch }
}
