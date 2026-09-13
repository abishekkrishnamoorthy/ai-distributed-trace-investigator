import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { TraceStatusBadge } from '../../components/traces/TraceStatusBadge'
import { useTraceComparison } from '../../hooks/useTraceComparison'
import { formatDateTime } from '../../utils/date'
import { formatDuration } from '../../utils/formatDuration'

const getSelectedTraceIds = (location) => {
  if (!Array.isArray(location.state?.traceIds)) {
    return []
  }

  return location.state.traceIds.filter((traceId) => typeof traceId === 'string' && traceId.trim())
}

const formatDifference = (value) => {
  if (value === null || value === undefined) {
    return 'Not comparable'
  }

  if (value === 0) {
    return '0 ms'
  }

  return `${value > 0 ? '+' : ''}${formatDuration(value)}`
}

const formatPercent = (value) => (
  value === null || value === undefined ? '' : `${value > 0 ? '+' : ''}${value}%`
)

const EmptyCompareState = ({ selectedCount }) => {
  const title = selectedCount === 1
    ? 'Select one more trace to compare.'
    : selectedCount > 2
      ? 'Select exactly 2 traces to compare.'
      : 'Select 2 traces to compare.'

  return (
    <div className="compare-empty state-panel">
      <strong>{title}</strong>
      <Link to="/traces">Back to traces</Link>
    </div>
  )
}

const CompareLoading = () => (
  <div className="compare-loading">
    <LoadingSkeleton className="compare-title-skeleton" />
    <LoadingSkeleton className="compare-panel-skeleton" />
    <LoadingSkeleton className="compare-panel-skeleton" />
  </div>
)

const TraceCard = ({ trace, label }) => (
  <article className="compare-trace-card">
    <span>{label}</span>
    <h2>{trace.traceId}</h2>
    <TraceStatusBadge status={trace.status} />
    <dl>
      <div>
        <dt>Duration</dt>
        <dd>{formatDuration(trace.overallDuration)}</dd>
      </div>
      <div>
        <dt>Spans</dt>
        <dd>{trace.spanCount}</dd>
      </div>
      <div>
        <dt>Root service</dt>
        <dd>{trace.rootService}</dd>
      </div>
      <div>
        <dt>Started</dt>
        <dd>{formatDateTime(trace.timestamp)}</dd>
      </div>
    </dl>
  </article>
)

const MetricComparison = ({ label, traceAValue, traceBValue }) => (
  <div className="compare-metric-row">
    <span>{label}</span>
    <strong>{traceAValue}</strong>
    <strong>{traceBValue}</strong>
  </div>
)

const ServiceDifferences = ({ uniqueServices, traceAId, traceBId }) => (
  <section className="compare-panel">
    <h2>Service Differences</h2>
    <div className="unique-service-grid">
      <div>
        <strong>Only in {traceAId}</strong>
        {uniqueServices.onlyInTraceA.length > 0 ? (
          uniqueServices.onlyInTraceA.map((service) => <span key={service}>{service}</span>)
        ) : (
          <small>None</small>
        )}
      </div>
      <div>
        <strong>Only in {traceBId}</strong>
        {uniqueServices.onlyInTraceB.length > 0 ? (
          uniqueServices.onlyInTraceB.map((service) => <span key={service}>{service}</span>)
        ) : (
          <small>None</small>
        )}
      </div>
    </div>
  </section>
)

const ServiceComparisonTable = ({ rows, traceAId, traceBId }) => (
  <section className="compare-panel">
    <h2>Service Comparison</h2>
    <p>Service duration is the aggregate of that service's span durations.</p>
    <div className="compare-table-scroll">
      <table className="compare-data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>{traceAId}</th>
            <th>{traceBId}</th>
            <th>Difference</th>
            <th>Slower</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.service}>
              <td>{row.service}</td>
              <td>{formatDuration(row.traceA.durationMs)} · {row.traceA.spanCount} spans · {row.traceA.errorSpanCount} errors</td>
              <td>{formatDuration(row.traceB.durationMs)} · {row.traceB.spanCount} spans · {row.traceB.errorSpanCount} errors</td>
              <td>
                {formatDifference(row.durationDifferenceMs)}
                {row.percentageDifference !== null ? <small>{formatPercent(row.percentageDifference)}</small> : null}
              </td>
              <td>{row.slowerTraceId || 'Same'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

const SpanComparisonTable = ({ rows, traceAId, traceBId }) => (
  <section className="compare-panel">
    <h2>Span Comparison</h2>
    <div className="compare-table-scroll">
      <table className="compare-data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Operation</th>
            <th>{traceAId}</th>
            <th>{traceBId}</th>
            <th>Difference</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.service}-${row.operation}-${row.occurrenceIndex}`}>
              <td>{row.service}</td>
              <td>
                {row.operation}
                {row.occurrenceIndex > 1 ? <small>Occurrence {row.occurrenceIndex}</small> : null}
              </td>
              <td>{row.traceA ? `${formatDuration(row.traceA.durationMs)} · ${row.traceA.status}` : 'Missing'}</td>
              <td>{row.traceB ? `${formatDuration(row.traceB.durationMs)} · ${row.traceB.status}` : 'Missing'}</td>
              <td>
                {formatDifference(row.durationDifferenceMs)}
                {row.percentageDifference !== null ? <small>{formatPercent(row.percentageDifference)}</small> : null}
              </td>
              <td>{row.statusChanged === null ? row.comparison : row.statusChanged ? 'Changed' : 'Same'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

export const ComparePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedTraceIds = useMemo(() => getSelectedTraceIds(location), [location])
  const { comparison, compare, error, loading } = useTraceComparison(selectedTraceIds)

  if (selectedTraceIds.length !== 2) {
    return (
      <section className="content compare-page">
        <EmptyCompareState selectedCount={selectedTraceIds.length} />
      </section>
    )
  }

  if (loading) {
    return (
      <section className="content compare-page">
        <CompareLoading />
      </section>
    )
  }

  if (error) {
    return (
      <section className="content compare-page">
        <ErrorState title={error} actionLabel="Try again" onAction={compare} />
      </section>
    )
  }

  if (!comparison) {
    return (
      <section className="content compare-page">
        <EmptyCompareState selectedCount={selectedTraceIds.length} />
      </section>
    )
  }

  const [traceA, traceB] = comparison.traces
  const { summary } = comparison

  return (
    <section className="content compare-page">
      <header className="compare-header">
        <div>
          <Link to="/traces">Back to traces</Link>
          <h1>Trace Comparison</h1>
          <p>Deterministic comparison of selected trace telemetry.</p>
        </div>
        <button type="button" onClick={() => navigate('/traces')}>Compare Different Traces</button>
      </header>

      <div className="compare-trace-grid">
        <TraceCard trace={traceA} label="Trace A" />
        <TraceCard trace={traceB} label="Trace B" />
      </div>

      <section className="compare-panel compare-summary-panel">
        <h2>Duration Difference</h2>
        <strong>{formatDifference(summary.durationDifferenceMs)}</strong>
        <span>{summary.slowerTraceId ? `${summary.slowerTraceId} is slower` : 'Both traces have the same duration'}</span>
        {summary.durationDifferencePercent !== null ? <small>{formatPercent(summary.durationDifferencePercent)} vs {traceB.traceId}</small> : null}
      </section>

      <section className="compare-panel">
        <h2>Trace Metrics</h2>
        <div className="compare-metric-head">
          <span>Metric</span>
          <strong>{traceA.traceId}</strong>
          <strong>{traceB.traceId}</strong>
        </div>
        <MetricComparison label="Status" traceAValue={summary.traceA.status} traceBValue={summary.traceB.status} />
        <MetricComparison label="Overall duration" traceAValue={formatDuration(summary.traceA.overallDuration)} traceBValue={formatDuration(summary.traceB.overallDuration)} />
        <MetricComparison label="Span count" traceAValue={summary.traceA.spanCount} traceBValue={summary.traceB.spanCount} />
        <MetricComparison label="Error spans" traceAValue={summary.traceA.errorSpanCount} traceBValue={summary.traceB.errorSpanCount} />
        <MetricComparison label="Services" traceAValue={summary.traceA.serviceCount} traceBValue={summary.traceB.serviceCount} />
        <MetricComparison label="Status changed" traceAValue={summary.statusComparison.different ? 'Yes' : 'No'} traceBValue={summary.statusComparison.different ? 'Yes' : 'No'} />
      </section>

      <ServiceDifferences uniqueServices={comparison.uniqueServices} traceAId={traceA.traceId} traceBId={traceB.traceId} />
      <ServiceComparisonTable rows={comparison.serviceComparison} traceAId={traceA.traceId} traceBId={traceB.traceId} />
      <SpanComparisonTable rows={comparison.spanComparison} traceAId={traceA.traceId} traceBId={traceB.traceId} />
    </section>
  )
}
