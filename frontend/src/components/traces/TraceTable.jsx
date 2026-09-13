import { useMemo } from 'react'
import { ErrorState } from '../common/ErrorState'
import { LoadingSkeleton } from '../common/LoadingSkeleton'
import { TraceTableHeader } from './TraceTableHeader'
import { TraceTableRow } from './TraceTableRow'
import { MobileTraceCard } from './MobileTraceCard'

const TableSkeletonRows = () => (
  Array.from({ length: 10 }).map((_, index) => (
    <tr key={`skeleton-${index}`}>
      <td><LoadingSkeleton className="checkbox-skeleton" /></td>
      <td><LoadingSkeleton className="row-skeleton medium" /></td>
      <td><LoadingSkeleton className="row-skeleton wide" /></td>
      <td><LoadingSkeleton className="row-skeleton wide" /></td>
      <td><LoadingSkeleton className="row-skeleton short" /></td>
      <td><LoadingSkeleton className="row-skeleton short" /></td>
      <td><LoadingSkeleton className="row-skeleton medium" /></td>
    </tr>
  ))
)

const MobileSkeletonCards = () => (
  Array.from({ length: 6 }).map((_, index) => (
    <div className="mobile-trace-card" key={`mobile-skeleton-${index}`}>
      <LoadingSkeleton className="checkbox-skeleton" />
      <div className="mobile-trace-content">
        <LoadingSkeleton className="row-skeleton medium" />
        <LoadingSkeleton className="row-skeleton wide" />
        <LoadingSkeleton className="row-skeleton medium" />
      </div>
      <LoadingSkeleton className="row-skeleton short" />
    </div>
  ))
)

export const TraceTable = ({
  traces,
  loading,
  error,
  selectedTraceIds,
  sort,
  onSort,
  onCopy,
  onRetry,
  onReset,
  onToggleTrace,
  onTogglePage,
  isTraceSelectionDisabled = () => false,
  disablePageSelection = false,
  errorTitle = 'Unable to load traces',
  emptyTitle = 'No traces found',
  emptyDescription = 'Try adjusting your search or filters.',
  resetLabel = 'Reset Filters',
}) => {
  const maxDuration = useMemo(() => {
    return traces.reduce((max, trace) => Math.max(max, trace.overallDuration || 0), 0)
  }, [traces])
  const allVisibleSelected = traces.length > 0 && traces.every((trace) => selectedTraceIds.has(trace.traceId))
  const someVisibleSelected = traces.some((trace) => selectedTraceIds.has(trace.traceId))

  return (
    <>
      <div className="table-shell">
        <div className="table-scroll">
        <table className="trace-table">
          <TraceTableHeader
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            sort={sort}
            onSort={onSort}
            onTogglePage={onTogglePage}
            disablePageSelection={disablePageSelection}
          />
          <tbody>
            {loading ? (
              <TableSkeletonRows />
            ) : error ? (
              <tr>
                <td colSpan="7">
                  <ErrorState title={errorTitle} onAction={onRetry} />
                </td>
              </tr>
            ) : traces.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="state-panel">
                    <strong>{emptyTitle}</strong>
                    <span>{emptyDescription}</span>
                    <button type="button" onClick={onReset}>{resetLabel}</button>
                  </div>
                </td>
              </tr>
            ) : (
              traces.map((trace) => (
                <TraceTableRow
                  key={trace.traceId}
                  trace={trace}
                  selected={selectedTraceIds.has(trace.traceId)}
                  disabled={isTraceSelectionDisabled(trace.traceId)}
                  maxDuration={maxDuration}
                  onCopy={onCopy}
                  onToggleTrace={onToggleTrace}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      <div className="mobile-trace-list">
        {loading ? (
          <MobileSkeletonCards />
        ) : error ? (
          <ErrorState title={errorTitle} onAction={onRetry} />
        ) : traces.length === 0 ? (
          <div className="state-panel">
            <strong>{emptyTitle}</strong>
            <span>{emptyDescription}</span>
            <button type="button" onClick={onReset}>{resetLabel}</button>
          </div>
        ) : (
          traces.map((trace) => (
            <MobileTraceCard
              key={trace.traceId}
              trace={trace}
              selected={selectedTraceIds.has(trace.traceId)}
              disabled={isTraceSelectionDisabled(trace.traceId)}
              onCopy={onCopy}
              onToggleTrace={onToggleTrace}
            />
          ))
        )}
      </div>
    </>
  )
}
