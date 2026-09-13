import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  DEFAULT_TRACE_FILTERS,
  DEFAULT_TRACE_PAGINATION,
  DEFAULT_TRACE_SORT,
} from '../../constants/trace'
import { AISearchPanel } from '../../components/traces/AISearchPanel'
import { TraceFilters } from '../../components/traces/TraceFilters'
import { TracePagination } from '../../components/traces/TracePagination'
import { TraceSelectionBar } from '../../components/traces/TraceSelectionBar'
import { TraceStats } from '../../components/traces/TraceStats'
import { TraceTable } from '../../components/traces/TraceTable'
import { useServices } from '../../hooks/useServices'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useTraceStats } from '../../hooks/useTraceStats'
import { useAISearch } from '../../hooks/useAISearch'
import { useTraces } from '../../hooks/useTraces'

const MAX_AI_ANALYSIS_SELECTION = 3

export const TracesPage = () => {
  const { showToast } = useOutletContext()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_TRACE_FILTERS)
  const [paginationState, setPaginationState] = useState(DEFAULT_TRACE_PAGINATION)
  const [sort, setSort] = useState(DEFAULT_TRACE_SORT)
  const [selectedTraceIds, setSelectedTraceIds] = useState(() => new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const debouncedTraceId = useDebouncedValue(filters.traceId, 400)

  const query = useMemo(() => ({
    page: paginationState.page,
    limit: paginationState.limit,
    traceId: debouncedTraceId,
    service: filters.service,
    status: filters.status,
    minDuration: filters.minDuration,
    maxDuration: filters.maxDuration,
    sortBy: sort.sortBy,
    order: sort.order,
  }), [
    debouncedTraceId,
    filters.maxDuration,
    filters.minDuration,
    filters.service,
    filters.status,
    paginationState.limit,
    paginationState.page,
    sort,
  ])

  const { stats, loading: statsLoading, error: statsError } = useTraceStats()
  const { services } = useServices()
  const aiSearch = useAISearch()
  const {
    traces,
    pagination,
    loading: tracesLoading,
    error: tracesError,
    refetch: refetchTraces,
  } = useTraces(query, { enabled: !aiSearch.isActive })

  const displayedTraces = aiSearch.isActive ? aiSearch.results : traces
  const displayedPagination = aiSearch.isActive ? aiSearch.pagination : pagination
  const displayedLoading = aiSearch.isActive ? aiSearch.loading : tracesLoading
  const displayedError = aiSearch.isActive ? Boolean(aiSearch.error) : tracesError
  const selectedCount = selectedTraceIds.size
  const canAnalyzeSelected = selectedCount >= 2 && selectedCount <= MAX_AI_ANALYSIS_SELECTION
  const canCompareSelected = selectedCount === 2

  const updateFilter = (key, value) => {
    if (aiSearch.isActive) {
      aiSearch.reset()
    }

    setFilters((current) => ({ ...current, [key]: value }))
    setPaginationState((current) => ({ ...current, page: 1 }))
    setSelectedTraceIds(new Set())
  }

  const resetFilters = () => {
    if (aiSearch.isActive) {
      aiSearch.reset()
    }

    setFilters(DEFAULT_TRACE_FILTERS)
    setSort(DEFAULT_TRACE_SORT)
    setPaginationState({ ...DEFAULT_TRACE_PAGINATION })
    setSelectedTraceIds(new Set())
    setShowAdvanced(false)
  }

  const handleSort = (field) => {
    if (aiSearch.isActive) {
      showToast('Clear AI Search before sorting normal traces')
      return
    }

    setSort((current) => ({
      sortBy: field,
      order: current.sortBy === field && current.order === 'desc' ? 'asc' : 'desc',
    }))
    setPaginationState((current) => ({ ...current, page: 1 }))
  }

  const handleCopy = async (traceId) => {
    try {
      await navigator.clipboard.writeText(traceId)
      showToast(`${traceId} copied`)
    } catch {
      showToast('Copy failed')
    }
  }

  const toggleTrace = (traceId) => {
    setSelectedTraceIds((current) => {
      const next = new Set(current)
      if (next.has(traceId)) {
        next.delete(traceId)
      } else if (next.size < MAX_AI_ANALYSIS_SELECTION) {
        next.add(traceId)
      } else {
        showToast('AI analysis supports a maximum of 3 traces.')
      }
      return next
    })
  }

  const togglePageSelection = (checked) => {
    setSelectedTraceIds((current) => {
      const next = new Set(current)
      const unselectedVisibleTraces = displayedTraces.filter((trace) => !next.has(trace.traceId))

      if (checked && next.size + unselectedVisibleTraces.length > MAX_AI_ANALYSIS_SELECTION) {
        showToast('AI analysis supports a maximum of 3 traces.')
        return next
      }

      displayedTraces.forEach((trace) => {
        if (checked) {
          next.add(trace.traceId)
        } else {
          next.delete(trace.traceId)
        }
      })
      return next
    })
  }

  const handleAISearchSubmit = (searchQuery) => {
    setSelectedTraceIds(new Set())
    aiSearch.search(searchQuery, 1, displayedPagination.limit)
  }

  const handleAISearchReset = () => {
    aiSearch.reset()
    setPaginationState((current) => ({ ...current, page: 1 }))
    setSelectedTraceIds(new Set())
  }

  const handlePageChange = (page) => {
    setSelectedTraceIds(new Set())

    if (aiSearch.isActive) {
      aiSearch.search(aiSearch.submittedQuery || aiSearch.query, page, aiSearch.pagination.limit)
      return
    }

    setPaginationState((current) => ({ ...current, page }))
  }

  const handleLimitChange = (limit) => {
    setSelectedTraceIds(new Set())

    if (aiSearch.isActive) {
      aiSearch.search(aiSearch.submittedQuery || aiSearch.query, 1, limit)
      return
    }

    setPaginationState((current) => ({ ...current, page: 1, limit }))
  }

  const handleAnalyzeSelected = () => {
    const traceIds = Array.from(selectedTraceIds)

    if (!canAnalyzeSelected) {
      showToast(traceIds.length > MAX_AI_ANALYSIS_SELECTION
        ? 'AI analysis supports a maximum of 3 traces.'
        : 'Select at least 2 traces for AI analysis')
      return
    }

    navigate('/ai-insights', { state: { traceIds } })
  }

  const handleCompareSelected = () => {
    const traceIds = Array.from(selectedTraceIds)

    if (!canCompareSelected) {
      showToast('Select exactly 2 traces to compare')
      return
    }

    navigate('/compare', { state: { traceIds } })
  }

  return (
    <>
      <div className="content">
        <section className="page-header">
          <div>
            <h1>Traces</h1>
            <p>Browse and analyze application traces across services.</p>
          </div>
          <div className="updated-at">
            <strong>Sep 10, 2026</strong>
            <span><i /> Last updated 11:02 AM</span>
          </div>
        </section>

        <TraceStats stats={stats} loading={statsLoading} error={statsError} />

        <AISearchPanel
          value={aiSearch.query}
          filters={aiSearch.filters}
          isActive={aiSearch.isActive}
          loading={aiSearch.loading}
          error={aiSearch.error}
          onChange={aiSearch.setQuery}
          onSubmit={handleAISearchSubmit}
          onReset={handleAISearchReset}
        />

        <TraceFilters
          filters={filters}
          services={services}
          showAdvanced={showAdvanced}
          onFilterChange={updateFilter}
          onToggleAdvanced={() => setShowAdvanced((current) => !current)}
          onApplyMobileFilters={() => setShowAdvanced(false)}
          onReset={resetFilters}
        />

        <TraceTable
          traces={displayedTraces}
          loading={displayedLoading}
          error={displayedError}
          selectedTraceIds={selectedTraceIds}
          sort={sort}
          onSort={handleSort}
          onCopy={handleCopy}
          onRetry={aiSearch.isActive ? () => aiSearch.search(aiSearch.submittedQuery || aiSearch.query, aiSearch.pagination.page, aiSearch.pagination.limit) : refetchTraces}
          onReset={aiSearch.isActive ? handleAISearchReset : resetFilters}
          onToggleTrace={toggleTrace}
          onTogglePage={togglePageSelection}
          isTraceSelectionDisabled={(traceId) => selectedTraceIds.size >= MAX_AI_ANALYSIS_SELECTION && !selectedTraceIds.has(traceId)}
          disablePageSelection={selectedTraceIds.size >= MAX_AI_ANALYSIS_SELECTION && !displayedTraces.every((trace) => selectedTraceIds.has(trace.traceId))}
          errorTitle={aiSearch.isActive ? 'Unable to run AI Search' : 'Unable to load traces'}
          emptyTitle={aiSearch.isActive ? 'No traces found for this search' : 'No traces found'}
          emptyDescription={aiSearch.isActive ? 'Try a broader natural-language query.' : 'Try adjusting your search or filters.'}
          resetLabel={aiSearch.isActive ? 'Clear AI Search' : 'Reset Filters'}
        />

        <TracePagination
          pagination={displayedPagination}
          loading={displayedLoading}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      <TraceSelectionBar
        count={selectedCount}
        canAnalyze={canAnalyzeSelected}
        canCompare={canCompareSelected}
        onClear={() => setSelectedTraceIds(new Set())}
        onAnalyze={handleAnalyzeSelected}
        onCompare={handleCompareSelected}
      />
    </>
  )
}
