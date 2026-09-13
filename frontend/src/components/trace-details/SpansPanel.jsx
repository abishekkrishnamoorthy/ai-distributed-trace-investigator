import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { flattenSpanTree, formatCandidateDuration, formatMs } from './traceDetailUtils'

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

export const SpansPanel = ({ trace }) => {
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
