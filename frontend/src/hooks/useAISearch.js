import { useCallback, useRef, useState } from 'react'
import { DEFAULT_TRACE_PAGINATION } from '../constants/trace'
import { traceApi } from '../services/traceApi'

const AI_SEARCH_ERRORS = {
  400: 'Unable to understand this search. Try a more specific query.',
  401: 'Your session expired. Please sign in again.',
  403: 'You do not have permission to use AI Search.',
  502: 'AI Search is temporarily unavailable. Please try again.',
}

const normalizeAISearchResponse = (response) => {
  const data = response?.data

  if (!data || !Array.isArray(data.results) || !data.pagination) {
    throw new Error('Unexpected AI Search response format')
  }

  return {
    query: data.query || '',
    filters: data.filters || {},
    results: data.results,
    pagination: {
      ...DEFAULT_TRACE_PAGINATION,
      ...data.pagination,
      totalPages: data.pagination.totalPages || 1,
    },
  }
}

const getAISearchErrorMessage = (error) => {
  return AI_SEARCH_ERRORS[error?.status] || 'Unable to run AI Search right now. Please try again.'
}

export const useAISearch = () => {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [results, setResults] = useState([])
  const [filters, setFilters] = useState({})
  const [pagination, setPagination] = useState(DEFAULT_TRACE_PAGINATION)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(false)
  const requestIdRef = useRef(0)

  const search = useCallback(async (nextQuery, page = 1, limit = DEFAULT_TRACE_PAGINATION.limit) => {
    const trimmedQuery = nextQuery.trim()

    if (!trimmedQuery) {
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setQuery(trimmedQuery)
    setSubmittedQuery(trimmedQuery)
    setIsActive(true)
    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await traceApi.aiSearchTraces(trimmedQuery, page, limit)
      const normalized = normalizeAISearchResponse(response)

      if (requestId !== requestIdRef.current) {
        return
      }

      setSubmittedQuery(normalized.query || trimmedQuery)
      setFilters(normalized.filters)
      setResults(normalized.results)
      setPagination(normalized.pagination)
    } catch (searchError) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setResults([])
      setFilters({})
      setPagination({ ...DEFAULT_TRACE_PAGINATION, page, limit })
      setError(getAISearchErrorMessage(searchError))
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const reset = useCallback(() => {
    requestIdRef.current += 1
    setQuery('')
    setSubmittedQuery('')
    setResults([])
    setFilters({})
    setPagination(DEFAULT_TRACE_PAGINATION)
    setLoading(false)
    setError('')
    setIsActive(false)
  }, [])

  return {
    query,
    submittedQuery,
    results,
    filters,
    pagination,
    loading,
    error,
    isActive,
    setQuery,
    search,
    reset,
  }
}
