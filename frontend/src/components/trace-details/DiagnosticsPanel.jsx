import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { formatDuration } from '../../utils/formatDuration'
import { flattenSpanTree, formatCandidateDuration, formatMs } from './traceDetailUtils'

const DiagnosticsMetricCard = ({ icon, tone = 'blue', value, label, secondary }) => (
  <article className="diagnostics-metric-card">
    <span className={`stat-icon ${tone}`}>
      <Icon name={icon} size={24} />
    </span>
    <span className="diagnostics-metric-copy">
      <strong title={String(value)}>{value}</strong>
      <span>{label}</span>
      {secondary ? <small>{secondary}</small> : null}
    </span>
  </article>
)

const CandidateField = ({ label, value, children }) => (
  <div className="candidate-field">
    <span>{label}</span>
    <span className="candidate-value">{children || value || '-'}</span>
  </div>
)

const SignalList = ({ signals = [] }) => {
  if (signals.length === 0) {
    return <span className="empty-value">-</span>
  }

  return (
    <span className="candidate-signals">
      {signals.map((signal) => (
        <span key={signal}>{signal}</span>
      ))}
    </span>
  )
}

const BottleneckCandidateCard = ({ candidate, rank }) => {
  const isPrimary = rank === 1

  return (
    <article className={`bottleneck-card ${isPrimary ? 'primary' : ''}`}>
      {isPrimary ? (
        <span className="primary-ribbon">PRIMARY BOTTLENECK CANDIDATE</span>
      ) : (
        <span className="candidate-rank">#{rank}</span>
      )}
      <div className="candidate-heading">
        <span className="span-cube">
          <Icon name="cube" size={22} />
        </span>
        <span>
          <strong>{candidate.service || '-'}</strong>
          <small>{candidate.operation || '-'}</small>
        </span>
      </div>
      <div className="candidate-fields">
        <CandidateField label="Span ID" value={candidate.spanId} />
        <CandidateField label="Duration" value={formatCandidateDuration(candidate.durationMs)} />
        <CandidateField label="Status">
          <TraceStatusBadge status={candidate.status || 'UNKNOWN'} />
        </CandidateField>
        <CandidateField label="Parent Span" value={candidate.parentSpanId || '-'} />
        <CandidateField label="Signals">
          <SignalList signals={candidate.signals || []} />
        </CandidateField>
      </div>
    </article>
  )
}

const DiagnosticsSection = ({ title, subtitle, children, className = '' }) => (
  <section className={`diagnostics-section ${className}`}>
    <header className="diagnostics-section-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
    {children}
  </section>
)

const EmptyDiagnosticsState = ({ title, message }) => (
  <div className="diagnostics-empty">
    <strong>{title}</strong>
    <p>{message}</p>
  </div>
)

const ErrorSpanRow = ({ span }) => (
  <button className="error-span-row" type="button">
    <span className="error-span-id">
      <span className="stat-icon red">
        <Icon name="warning" size={21} />
      </span>
      <strong>{span.spanId || '-'}</strong>
    </span>
    <span>{span.service || '-'}</span>
    <span>{span.operation || '-'}</span>
    <strong>{formatMs(span.durationMs)}</strong>
    <TraceStatusBadge status={span.status || 'ERROR'} />
    <span>{span.parentSpanId || '-'}</span>
    <span>{span.kind || '-'}</span>
    <Icon name="chevronRight" size={20} />
  </button>
)

const ErrorSpanMobileCard = ({ span }) => (
  <button className="error-span-mobile-card" type="button">
    <span className="error-span-mobile-head">
      <span>
        <span className="stat-icon red">
          <Icon name="warning" size={20} />
        </span>
        <strong>{span.spanId || '-'}</strong>
      </span>
      <TraceStatusBadge status={span.status || 'ERROR'} />
    </span>
    <strong>{span.service || '-'}</strong>
    <span>{span.operation || '-'}</span>
    <span className="error-span-mobile-grid">
      <span>Duration</span>
      <strong>{formatMs(span.durationMs)}</strong>
      <span>Parent</span>
      <strong>{span.parentSpanId || '-'}</strong>
      <span>Kind</span>
      <strong>{span.kind || '-'}</strong>
    </span>
    <Icon name="chevronRight" size={20} />
  </button>
)

export const DiagnosticsPanel = ({ trace }) => {
  const metrics = trace.metrics || {}
  const errorSpanCount = metrics.errorSpanCount || 0
  const spanCount = trace.spanCount || 0
  const errorPercent = spanCount > 0 ? Math.round((errorSpanCount / spanCount) * 100) : 0
  const longestSpan = metrics.longestSpan || {}
  const candidates = trace.bottleneckCandidates || []
  const spanById = new Map(flattenSpanTree(trace.spans || []).map((span) => [span.spanId, span]))
  const errorSpans = (metrics.errorSpans || []).map((span) => ({
    ...spanById.get(span.spanId),
    ...span,
  }))

  return (
    <div className="diagnostics-panel">
      <DiagnosticsSection
        title="1. Trace Metrics"
        subtitle="Key metrics and statistics for this trace."
      >
        <div className="diagnostics-metrics-grid">
          <DiagnosticsMetricCard
            icon="clock"
            value={formatDuration(trace.overallDuration)}
            label="Total Duration"
            secondary={formatMs(trace.overallDuration)}
          />
          <DiagnosticsMetricCard
            icon="network"
            tone="green"
            value={spanCount}
            label="Total Spans"
          />
          <DiagnosticsMetricCard
            icon="database"
            value={(trace.services || []).length}
            label={(trace.services || []).length === 1 ? 'Service' : 'Services'}
          />
          <DiagnosticsMetricCard
            icon="warning"
            tone="red"
            value={errorSpanCount}
            label="Error Spans"
            secondary={`${errorPercent}% of total`}
          />
          <DiagnosticsMetricCard icon="refresh" value={trace.rootService || '-'} label="Root Service" />
          <DiagnosticsMetricCard
            icon="activity"
            tone="yellow"
            value={longestSpan.spanId || '-'}
            label="Longest Span"
            secondary={formatMs(longestSpan.durationMs)}
          />
        </div>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="2. Bottleneck Candidates"
        subtitle="Potential performance bottlenecks identified in this trace, ordered by likelihood."
      >
        {candidates.length > 0 ? (
          <div className="bottleneck-viewport">
            <div className="bottleneck-grid">
              {candidates.map((candidate, index) => (
                <BottleneckCandidateCard
                  key={candidate.spanId || `${candidate.service}-${index}`}
                  candidate={candidate}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyDiagnosticsState
            title="No bottleneck candidates identified"
            message="The available telemetry did not produce a candidate."
          />
        )}
      </DiagnosticsSection>

      <DiagnosticsSection
        title={`3. Error Spans (${errorSpans.length})`}
        subtitle="Spans that ended with an error status."
      >
        {errorSpans.length > 0 ? (
          <>
            <div className="error-spans-table">
              <div className="error-spans-head">
                <span>Span ID</span>
                <span>Service</span>
                <span>Operation</span>
                <span>Duration</span>
                <span>Status</span>
                <span>Parent Span</span>
                <span>Kind</span>
                <span>Action</span>
              </div>
              {errorSpans.map((span) => (
                <ErrorSpanRow key={span.spanId} span={span} />
              ))}
            </div>
            <div className="error-spans-mobile-list">
              {errorSpans.map((span) => (
                <ErrorSpanMobileCard key={span.spanId} span={span} />
              ))}
            </div>
          </>
        ) : (
          <EmptyDiagnosticsState
            title="No error spans"
            message="This trace completed without any error spans."
          />
        )}
      </DiagnosticsSection>
    </div>
  )
}
