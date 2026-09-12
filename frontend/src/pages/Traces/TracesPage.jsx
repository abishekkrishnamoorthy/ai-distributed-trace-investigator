import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
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
import { useTraces } from '../../hooks/useTraces'

export const TracesPage = () => {
  const { showToast } = useOutletContext()
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
  const {
    traces,
    pagination,
    loading: tracesLoading,
    error: tracesError,
    refetch: refetchTraces,
  } = useTraces(query)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPaginationState((current) => ({ ...current, page: 1 }))
    setSelectedTraceIds(new Set())
  }

  const resetFilters = () => {
    setFilters(DEFAULT_TRACE_FILTERS)
    setSort(DEFAULT_TRACE_SORT)
    setPaginationState({ ...DEFAULT_TRACE_PAGINATION })
    setSelectedTraceIds(new Set())
    setShowAdvanced(false)
  }

  const handleSort = (field) => {
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
      } else {
        next.add(traceId)
      }
      return next
    })
  }

  const togglePageSelection = (checked) => {
    setSelectedTraceIds((current) => {
      const next = new Set(current)
      traces.forEach((trace) => {
        if (checked) {
          next.add(trace.traceId)
        } else {
          next.delete(trace.traceId)
        }
      })
      return next
    })
  }

  const handlePreparedAction = (label) => {
    showToast(`${label} is prepared for a future workflow.`)
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

        <AISearchPanel onNotice={showToast} />

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
          traces={traces}
          loading={tracesLoading}
          error={tracesError}
          selectedTraceIds={selectedTraceIds}
          sort={sort}
          onSort={handleSort}
          onCopy={handleCopy}
          onRetry={refetchTraces}
          onReset={resetFilters}
          onToggleTrace={toggleTrace}
          onTogglePage={togglePageSelection}
        />

        <TracePagination
          pagination={pagination}
          loading={tracesLoading}
          onPageChange={(page) => setPaginationState((current) => ({ ...current, page }))}
          onLimitChange={(limit) => setPaginationState((current) => ({ ...current, page: 1, limit }))}
        />
      </div>

      <TraceSelectionBar
        count={selectedTraceIds.size}
        onClear={() => setSelectedTraceIds(new Set())}
        onAnalyze={() => handlePreparedAction('Analyze Selected')}
        onCompare={() => handlePreparedAction('Compare Selected')}
      />
    </>
  )
}
