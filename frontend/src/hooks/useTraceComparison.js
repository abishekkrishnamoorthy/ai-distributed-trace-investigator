import { useCallback, useEffect, useState } from 'react'
import { traceApi } from '../services/traceApi'

const COMPARE_ERRORS = {
  400: 'Please select exactly 2 different traces.',
  404: 'One or more selected traces could not be found.',
}

const getCompareErrorMessage = (error) => (
  COMPARE_ERRORS[error?.status] || 'Unable to compare the selected traces right now.'
)

export const useTraceComparison = (traceIds = []) => {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const compare = useCallback(async () => {
    if (traceIds.length !== 2) {
      setComparison(null)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await traceApi.compareTraces(traceIds)
      setComparison(response.data || null)
    } catch (compareError) {
      setComparison(null)
      setError(getCompareErrorMessage(compareError))
    } finally {
      setLoading(false)
    }
  }, [traceIds])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      compare()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [compare])

  return {
    comparison,
    compare,
    error,
    loading,
  }
}
