import { useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { TraceStatusBadge } from '../../components/traces/TraceStatusBadge'
import {
  createScaleMarkers,
  getBarWidth,
  getInitialExpandedState,
  getRoundedTimelineMax,
  getStatusClass,
  getVisibleTimelineRows,
  groupServices,
} from './timelineUtils'

const STATUS_LABELS = ['OK', 'ERROR', 'UNKNOWN']

const TimelineBar = ({ duration, max, status, label }) => (
  <div className="timeline-bar-track" aria-label={`${label}: ${duration} ms`}>
    <span
      className={`timeline-bar timeline-bar-${getStatusClass(status)}`}
      style={{ width: `${getBarWidth(duration, max)}%` }}
    />
  </div>
)

const TimelineHeader = () => (
  <header className="timeline-panel-header">
    <div>
      <h2>Span Timeline</h2>
      <p>Hierarchical view of spans and their duration. All spans are shown relative to 0 ms.</p>
    </div>
    <div className="timeline-legend" aria-label="Span status legend">
      {STATUS_LABELS.map((status) => (
        <span key={status}>
          <i className={`legend-dot legend-dot-${getStatusClass(status)}`} />
          {status}
        </span>
      ))}
    </div>
  </header>
)

const TreeGuides = ({ row }) => (
  <span className="span-tree-guides" aria-hidden="true">
    {row.ancestorContinuations.map((continues, index) => (
      <span
        className={`tree-guide ${continues ? 'tree-guide-continues' : ''}`}
        key={`${row.spanId}-guide-${index}`}
      />
    ))}
    {row.depth > 0 ? (
      <span className={`tree-guide tree-elbow ${row.isLast ? 'tree-elbow-last' : ''}`} />
    ) : null}
  </span>
)

const SpanIdentity = ({ row, compact = false, onToggle }) => (
  <div className="span-identity">
    <TreeGuides row={row} />
    {row.hasChildren ? (
      <button
        className="span-toggle"
        type="button"
        aria-label={`${row.expanded ? 'Collapse' : 'Expand'} ${row.service}`}
        aria-expanded={row.expanded}
        onClick={(event) => {
          event.stopPropagation()
          onToggle(row.spanId)
        }}
      >
        <Icon name={row.expanded ? 'chevronDown' : 'chevronRight'} size={compact ? 19 : 16} />
      </button>
    ) : (
      <span className="span-toggle-placeholder" />
    )}
    <span className="span-cube">
      <Icon name="cube" size={compact ? 24 : 20} />
    </span>
    <span className="span-copy">
      <strong>{row.service}</strong>
      <small>{row.operation}</small>
    </span>
  </div>
)

const TimelineSpanRow = ({ row, barMax, onToggle }) => (
  <tr>
    <td>
      <SpanIdentity row={row} onToggle={onToggle} />
    </td>
    <td>
      <TraceStatusBadge status={row.status || 'UNKNOWN'} />
    </td>
    <td>{(row.durationMs || 0).toLocaleString()} ms</td>
    <td>
      <div className="timeline-visual-cell">
        <TimelineBar
          duration={row.durationMs || 0}
          max={barMax}
          status={row.status}
          label={row.service}
        />
        <span>{(row.durationMs || 0).toLocaleString()} ms</span>
      </div>
    </td>
  </tr>
)

const TimelineTree = ({ rows, markers, barMax, onToggle }) => (
  <div className="timeline-table-wrap">
    <table className="timeline-table">
      <thead>
        <tr>
          <th>Service / Operation</th>
          <th>Status</th>
          <th>Duration</th>
          <th>
            <div className="timeline-scale">
              {markers.map((marker) => (
                <span key={marker}>{marker.toLocaleString()} ms</span>
              ))}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <TimelineSpanRow
            key={row.spanId}
            row={row}
            barMax={barMax}
            onToggle={onToggle}
          />
        ))}
      </tbody>
    </table>
  </div>
)

const MobileTimelineSpan = ({ row, barMax, onToggle }) => (
  <article className="timeline-mobile-span">
    <div className="timeline-mobile-span-head">
      <SpanIdentity row={row} compact onToggle={onToggle} />
    </div>
    <div className="timeline-mobile-meta">
      <TraceStatusBadge status={row.status || 'UNKNOWN'} />
      <strong>{(row.durationMs || 0).toLocaleString()} ms</strong>
    </div>
    <div className="timeline-mobile-duration">
      <TimelineBar
        duration={row.durationMs || 0}
        max={barMax}
        status={row.status}
        label={row.service}
      />
    </div>
  </article>
)

const MobileTimeline = ({ rows, barMax, onToggle }) => (
  <div className="timeline-mobile-list">
    {rows.map((row) => (
      <MobileTimelineSpan
        key={row.spanId}
        row={row}
        barMax={barMax}
        onToggle={onToggle}
      />
    ))}
  </div>
)

const TimelineInfo = () => (
  <aside className="timeline-info">
    <span>
      <Icon name="info" size={25} />
    </span>
    <div>
      <strong>Timeline shows span durations only.</strong>
      <p>
        Span start offsets are not available in the supplied telemetry, so all spans are visualized
        from 0 ms. Bars represent relative duration, not actual execution offsets.
      </p>
    </div>
  </aside>
)

export const TimelinePanel = ({ trace }) => {
  const [expanded, setExpanded] = useState(() => getInitialExpandedState(trace.spans || []))
  const rows = useMemo(
    () => getVisibleTimelineRows(trace.spans || [], expanded),
    [expanded, trace.spans],
  )
  const scaleMax = getRoundedTimelineMax(trace.overallDuration)
  const barMax = trace.overallDuration || scaleMax
  const markers = createScaleMarkers(scaleMax)

  const toggleSpan = (spanId) => {
    setExpanded((current) => ({
      ...current,
      [spanId]: !current[spanId],
    }))
  }

  return (
    <section className="timeline-panel">
      <TimelineHeader />
      <TimelineTree
        rows={rows}
        markers={markers}
        barMax={barMax}
        onToggle={toggleSpan}
      />
      <MobileTimeline rows={rows} barMax={barMax} onToggle={toggleSpan} />
      <TimelineInfo />
    </section>
  )
}

export const ServicesInTrace = ({ trace }) => {
  const serviceGroups = useMemo(() => groupServices(trace.spans || []), [trace.spans])
  const services = trace.services || []

  return (
    <aside className="trace-services-panel">
      <h2>Services in this Trace</h2>
      <ul>
        {services.map((service) => {
          const group = serviceGroups.get(service) || { count: 0, hasError: false }

          return (
            <li key={service}>
              <span className={`legend-dot legend-dot-${group.hasError ? 'error' : 'ok'}`} />
              <strong>{service}</strong>
              <small>
                {group.count} {group.count === 1 ? 'span' : 'spans'}
              </small>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
