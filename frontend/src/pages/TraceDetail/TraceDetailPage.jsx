import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/common/ErrorState'
import { Icon } from '../../components/common/Icon'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { TraceStatusBadge } from '../../components/traces/TraceStatusBadge'
import { traceApi } from '../../services/traceApi'
import { formatDateTime, formatRelativeTime } from '../../utils/date'
import { formatDuration } from '../../utils/formatDuration'
import { ServicesInTrace, TimelinePanel } from './TimelinePanel'

const TRACE_TABS = [
  { id: 'timeline', label: 'Timeline', icon: 'list' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'barChart' },
  { id: 'spans', label: 'Spans', icon: 'share' },
  { id: 'raw', label: 'Raw Data', icon: 'code' },
  { id: 'analysis', label: 'AI Analysis', icon: 'ai' },
]

const DetailStatCard = ({ icon, tone = 'blue', value, label, status }) => (
  <article className="stat-card trace-detail-stat">
    <span className={`stat-icon ${tone}`}>
      <Icon name={icon} size={26} />
    </span>
    <span className="stat-content">
      <strong className="stat-value" title={String(value)}>
        {value}
      </strong>
      <span className="stat-label">{label}</span>
    </span>
    {status ? <TraceStatusBadge status={status} /> : null}
  </article>
)

const formatMs = (durationMs) =>
  Number.isFinite(durationMs) ? `${durationMs.toLocaleString()} ms` : '-'

const formatCandidateDuration = (durationMs) => {
  if (!Number.isFinite(durationMs)) {
    return '-'
  }

  return `${durationMs.toLocaleString()} ms (${formatDuration(durationMs)})`
}

const flattenSpanTree = (spans = []) =>
  spans.flatMap((span) => [span, ...flattenSpanTree(span.children || [])])

const createSpanRows = (spans = [], expandedSpanIds = {}, depth = 0) =>
  spans.flatMap((span, index) => {
    const children = span.children || []
    const isLast = index === spans.length - 1
    const row = {
      ...span,
      depth,
      isLast,
      hasChildren: children.length > 0,
      expanded: Boolean(expandedSpanIds[span.spanId]),
    }

    if (!row.hasChildren || !row.expanded) {
      return [row]
    }

    return [row, ...createSpanRows(children, expandedSpanIds, depth + 1)]
  })

const getExpandedSpanIds = (spans = []) => {
  const expanded = {}

  const visit = (span) => {
    if ((span.children || []).length > 0) {
      expanded[span.spanId] = true
      span.children.forEach(visit)
    }
  }

  spans.forEach(visit)
  return expanded
}

const getSpanSearchText = (span) =>
  [span.spanId, span.service, span.operation].filter(Boolean).join(' ').toLowerCase()

const getSpanAttributes = (span) => {
  if (!span || !span.attributes || typeof span.attributes !== 'object') {
    return []
  }

  return Object.entries(span.attributes)
}

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

const DiagnosticsPanel = ({ trace }) => {
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

const SpanMetadata = ({ span }) => (
  <dl className="span-metadata">
    <div>
      <dt>Span ID</dt>
      <dd>{span.spanId || '-'}</dd>
    </div>
    <div>
      <dt>Service</dt>
      <dd>{span.service || '-'}</dd>
    </div>
    <div>
      <dt>Operation</dt>
      <dd>{span.operation || '-'}</dd>
    </div>
    <div>
      <dt>Status</dt>
      <dd>
        <TraceStatusBadge status={span.status || 'UNKNOWN'} />
      </dd>
    </div>
    <div>
      <dt>Duration</dt>
      <dd>{formatCandidateDuration(span.durationMs)}</dd>
    </div>
    <div>
      <dt>Parent Span</dt>
      <dd>{span.parentSpanId || '-'}</dd>
    </div>
    <div>
      <dt>Kind</dt>
      <dd>{span.kind || '-'}</dd>
    </div>
  </dl>
)

const SpanDetailsTabs = ({ span, activeTab, onTabChange, onCopy }) => {
  const attributes = getSpanAttributes(span)
  const rawJson = JSON.stringify(span, null, 2)

  return (
    <div className="span-details-tabs">
      <div className="span-details-tab-list">
        <button
          className={activeTab === 'attributes' ? 'active' : ''}
          type="button"
          onClick={() => onTabChange('attributes')}
        >
          Attributes
        </button>
        <button
          className={activeTab === 'raw' ? 'active' : ''}
          type="button"
          onClick={() => onTabChange('raw')}
        >
          Raw Span Data
        </button>
      </div>
      <div className="span-details-tab-panel">
        {activeTab === 'attributes' ? (
          attributes.length > 0 ? (
            <dl className="span-attributes">
              {attributes.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="span-tab-empty">
              <Icon name="doc" size={24} />
              <div>
                <strong>No attributes available</strong>
                <p>This span does not contain any attributes in the provided data.</p>
              </div>
            </div>
          )
        ) : (
          <div className="raw-span-panel">
            <button type="button" onClick={() => onCopy(rawJson)}>
              <Icon name="copy" size={16} />
              Copy
            </button>
            <pre>{rawJson}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

const SpanDetails = ({ span, activeTab, onTabChange, onClose, onSelectSpan, onCopy }) => {
  if (!span) {
    return (
      <aside className="span-details-panel span-details-empty">
        <button className="span-details-close" type="button" onClick={onClose} aria-label="Close span details">
          <Icon name="x" size={20} />
        </button>
        <strong>Select a span to view details</strong>
        <p>Click a span row to inspect its metadata, children, and raw span data.</p>
      </aside>
    )
  }

  const children = span.children || []

  return (
    <aside className="span-details-panel">
      <header className="span-details-header">
        <h2>Span Details</h2>
        <button className="span-details-close" type="button" onClick={onClose} aria-label="Close span details">
          <Icon name="x" size={20} />
        </button>
      </header>
      <div className="span-detail-scroll">
        <section className="span-detail-summary">
          <span className="span-cube">
            <Icon name="cube" size={28} />
          </span>
          <div>
            <span className="span-detail-title">
              <strong>{span.spanId || '-'}</strong>
              <TraceStatusBadge status={span.status || 'UNKNOWN'} />
            </span>
            <p>{span.operation || '-'}</p>
            <small>{span.service || '-'}</small>
          </div>
        </section>

        <SpanMetadata span={span} />

        <section className="span-children">
          <h3>Children ({children.length})</h3>
          {children.length > 0 ? (
            <div className="span-children-list">
              {children.map((child) => (
                <button type="button" key={child.spanId} onClick={() => onSelectSpan(child.spanId)}>
                  <span className="span-cube">
                    <Icon name="cube" size={20} />
                  </span>
                  <span>
                    <strong>{child.spanId || '-'}</strong>
                    <small>{child.service || '-'}</small>
                  </span>
                  <span>{formatMs(child.durationMs)}</span>
                  <TraceStatusBadge status={child.status || 'UNKNOWN'} />
                </button>
              ))}
            </div>
          ) : (
            <p className="span-no-children">No child spans</p>
          )}
        </section>

        <SpanDetailsTabs
          span={span}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onCopy={onCopy}
        />
      </div>
    </aside>
  )
}

const SpanRowIdentity = ({ row, onToggle }) => (
  <span className="spans-row-identity" style={{ '--span-depth': row.depth }}>
    {row.hasChildren ? (
      <button
        className="span-toggle"
        type="button"
        aria-label={`${row.expanded ? 'Collapse' : 'Expand'} ${row.spanId}`}
        aria-expanded={row.expanded}
        onClick={(event) => {
          event.stopPropagation()
          onToggle(row.spanId)
        }}
      >
        <Icon name={row.expanded ? 'chevronDown' : 'chevronRight'} size={17} />
      </button>
    ) : (
      <span className="span-toggle-placeholder" />
    )}
    <span className="span-cube">
      <Icon name="cube" size={20} />
    </span>
    <strong>{row.spanId || '-'}</strong>
  </span>
)

const handleSpanRowKeyDown = (event, spanId, onSelect) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onSelect(spanId)
  }
}

const SpanTableRow = ({ row, index, selected, onSelect, onToggle }) => (
  <div
    className={`spans-table-row ${selected ? 'selected' : ''}`}
    role="button"
    tabIndex={0}
    onClick={() => onSelect(row.spanId)}
    onKeyDown={(event) => handleSpanRowKeyDown(event, row.spanId, onSelect)}
  >
    <span>{index + 1}</span>
    <SpanRowIdentity row={row} onToggle={onToggle} />
    <span>{row.service || '-'}</span>
    <span>{row.operation || '-'}</span>
    <TraceStatusBadge status={row.status || 'UNKNOWN'} />
    <strong>{formatMs(row.durationMs)}</strong>
    <span>{row.parentSpanId || '-'}</span>
    <span>{row.kind || '-'}</span>
  </div>
)

const MobileSpanRow = ({ row, index, selected, onSelect, onToggle }) => (
  <div
    className={`mobile-span-row ${selected ? 'selected' : ''}`}
    role="button"
    tabIndex={0}
    onClick={() => onSelect(row.spanId)}
    onKeyDown={(event) => handleSpanRowKeyDown(event, row.spanId, onSelect)}
    style={{ '--span-depth': row.depth }}
  >
    <span className="mobile-span-head">
      <span>
        <strong>#{index + 1}</strong>
        {row.hasChildren ? (
          <button
            className="span-toggle"
            type="button"
            aria-label={`${row.expanded ? 'Collapse' : 'Expand'} ${row.spanId}`}
            aria-expanded={row.expanded}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(row.spanId)
            }}
          >
            <Icon name={row.expanded ? 'chevronDown' : 'chevronRight'} size={18} />
          </button>
        ) : null}
        <span className="span-cube">
          <Icon name="cube" size={20} />
        </span>
        <strong>{row.spanId || '-'}</strong>
      </span>
      <TraceStatusBadge status={row.status || 'UNKNOWN'} />
    </span>
    <span className="mobile-span-copy">
      <strong>{row.service || '-'}</strong>
      <span>{row.operation || '-'}</span>
      <small>{formatMs(row.durationMs)}</small>
    </span>
  </div>
)

const SpansPanel = ({ trace }) => {
  const { showToast } = useOutletContext()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedSpanIds, setExpandedSpanIds] = useState(() => getExpandedSpanIds(trace.spans || []))
  const [selectedSpanId, setSelectedSpanId] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTab, setDetailsTab] = useState('attributes')

  const spanById = useMemo(
    () => new Map(flattenSpanTree(trace.spans || []).map((span) => [span.spanId, span])),
    [trace.spans],
  )
  const spanRows = useMemo(
    () => createSpanRows(trace.spans || [], expandedSpanIds),
    [expandedSpanIds, trace.spans],
  )
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return spanRows.filter((span) => {
      const matchesSearch = !query || getSpanSearchText(span).includes(query)
      const matchesStatus = statusFilter === 'ALL' || span.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, spanRows, statusFilter])
  const selectedSpan = selectedSpanId ? spanById.get(selectedSpanId) : null

  const toggleSpan = (spanId) => {
    setExpandedSpanIds((current) => ({
      ...current,
      [spanId]: !current[spanId],
    }))
  }

  const selectSpan = (spanId) => {
    setSelectedSpanId(spanId)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedSpanId(null)
  }

  const copyRawSpan = async (json) => {
    if (!navigator.clipboard) {
      showToast('Clipboard unavailable')
      return
    }

    try {
      await navigator.clipboard.writeText(json)
      showToast('Raw span data copied')
    } catch {
      showToast('Unable to copy raw span data')
    }
  }

  return (
    <div className={`spans-layout ${detailsOpen ? 'details-open' : ''}`}>
      <section className="spans-panel">
        <header className="spans-panel-header">
          <div>
            <h2>Spans ({trace.spanCount || flattenSpanTree(trace.spans || []).length})</h2>
            <p>All spans in this trace in hierarchical order.</p>
          </div>
          <div className="span-filters">
            <label className="span-search">
              <Icon name="search" size={20} />
              <input
                type="search"
                placeholder="Search spans..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="span-status-filter">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All Status</option>
                <option value="OK">OK</option>
                <option value="ERROR">ERROR</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
              <Icon name="chevronDown" size={18} />
            </label>
          </div>
        </header>

        <div className="spans-table">
          <div className="spans-table-head">
            <span>#</span>
            <span>Span ID</span>
            <span>Service</span>
            <span>Operation</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Parent Span</span>
            <span>Kind</span>
          </div>
          {filteredRows.length > 0 ? (
            filteredRows.map((row, index) => (
              <SpanTableRow
                key={row.spanId}
                row={row}
                index={index}
                selected={row.spanId === selectedSpanId}
                onSelect={selectSpan}
                onToggle={toggleSpan}
              />
            ))
          ) : (
            <div className="spans-empty-state">No spans match the current filters.</div>
          )}
        </div>

        <div className="mobile-spans-list">
          {filteredRows.length > 0 ? (
            filteredRows.map((row, index) => (
              <MobileSpanRow
                key={row.spanId}
                row={row}
                index={index}
                selected={row.spanId === selectedSpanId}
                onSelect={selectSpan}
                onToggle={toggleSpan}
              />
            ))
          ) : (
            <div className="spans-empty-state">No spans match the current filters.</div>
          )}
        </div>

        <aside className="spans-footer-info">
          <span>
            <Icon name="info" size={24} />
          </span>
          <div>
            <strong>{trace.spanCount || flattenSpanTree(trace.spans || []).length} spans in this trace</strong>
            <p>Spans are shown in hierarchical order. Click on a span to view more details.</p>
          </div>
        </aside>
      </section>

      <SpanDetails
        span={detailsOpen ? selectedSpan : null}
        activeTab={detailsTab}
        onTabChange={setDetailsTab}
        onClose={closeDetails}
        onSelectSpan={selectSpan}
        onCopy={copyRawSpan}
      />

      <div className={`span-details-backdrop ${detailsOpen ? 'open' : ''}`} onClick={closeDetails} />
      <div className={`mobile-span-details ${detailsOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <span className="sheet-handle" />
        <SpanDetails
          span={selectedSpan}
          activeTab={detailsTab}
          onTabChange={setDetailsTab}
          onClose={closeDetails}
          onSelectSpan={selectSpan}
          onCopy={copyRawSpan}
        />
      </div>
    </div>
  )
}

export const TraceDetailPage = () => {
  const { traceId } = useParams()
  const { showToast } = useOutletContext()
  const [trace, setTrace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')

  useEffect(() => {
    let active = true

    const loadTrace = async () => {
      setLoading(true)
      setError(false)

      try {
        const result = await traceApi.getTraceById(traceId)

        if (active) {
          setTrace(result.data)
        }
      } catch {
        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTrace()

    return () => {
      active = false
    }
  }, [traceId])

  const tabContent = useMemo(() => {
    if (!trace) {
      return null
    }

    if (activeTab === 'diagnostics') {
      return <DiagnosticsPanel trace={trace} />
    }

    if (activeTab === 'spans') {
      return <SpansPanel trace={trace} />
    }

    return (
      <div className="trace-timeline-layout">
        <TimelinePanel key={trace.traceId} trace={trace} />
        <ServicesInTrace trace={trace} />
      </div>
    )
  }, [activeTab, trace])

  if (loading) {
    return (
      <section className="content trace-detail-page">
        <LoadingSkeleton className="trace-detail-loading" />
      </section>
    )
  }

  if (error || !trace) {
    return (
      <section className="content trace-detail-page">
        <ErrorState title="Trace not found" onAction={() => window.location.reload()} />
      </section>
    )
  }

  const relativeTime = formatRelativeTime(trace.timestamp)

  return (
    <section className="content trace-detail-page">
      <div className="trace-detail-topline">
        <Link to="/traces">
          <Icon name="chevronLeft" size={20} />
          Back to Traces
        </Link>
        <div className="trace-detail-actions">
          <button
            className="analyze-button"
            type="button"
            onClick={() => showToast('AI analysis queued')}
          >
            <Icon name="ai" size={20} />
            Analyze with AI
          </button>
          <button
            className="trace-action-button"
            type="button"
            onClick={() => showToast('Trace link copied')}
          >
            <Icon name="share" size={19} />
            Share Trace
          </button>
          <button className="trace-more-button" type="button" aria-label="More trace actions">
            ...
          </button>
        </div>
      </div>

      <header className="trace-detail-header">
        <div>
          <h1>
            Trace: {trace.traceId}
            <TraceStatusBadge status={trace.status} />
          </h1>
          <p>
            {formatDateTime(trace.timestamp)}
            {relativeTime ? ` (${relativeTime})` : ''}
          </p>
        </div>
      </header>

      <div className="trace-detail-stats">
        <DetailStatCard
          icon="clock"
          value={formatDuration(trace.overallDuration)}
          label="Total Duration"
        />
        <DetailStatCard
          icon="network"
          tone="green"
          value={trace.spanCount}
          label="Total Spans"
        />
        <DetailStatCard icon="refresh" value={trace.rootService} label="Root Service" />
        <DetailStatCard icon="warning" tone="red" value={trace.status} label="Trace Status" />
        <DetailStatCard
          icon="database"
          value={(trace.services || []).length}
          label={(trace.services || []).length === 1 ? 'Service' : 'Services'}
        />
        <DetailStatCard icon="calendar" value={formatDateTime(trace.timestamp)} label="Start Time" />
      </div>

      <nav className="trace-tabs" aria-label="Trace detail tabs">
        {TRACE_TABS.map((tab) => {
          const selectable = tab.id === 'timeline' || tab.id === 'diagnostics' || tab.id === 'spans'

          return (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              type="button"
              key={tab.id}
              onClick={() => {
                if (selectable) {
                  setActiveTab(tab.id)
                }
              }}
            >
              <Icon name={tab.icon} size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {tabContent}
    </section>
  )
}
