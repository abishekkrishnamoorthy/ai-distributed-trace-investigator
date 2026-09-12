import { Link } from 'react-router-dom'
import { formatDateTime } from '../../utils/date'
import { formatDuration } from '../../utils/formatDuration'
import { Icon } from '../common/Icon'
import { TraceStatusBadge } from './TraceStatusBadge'

export const MobileTraceCard = ({ trace, selected, onCopy, onToggleTrace }) => (
  <article className="mobile-trace-card">
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onToggleTrace(trace.traceId)}
      aria-label={`Select ${trace.traceId}`}
    />
    <div className="mobile-trace-content">
      <span className="mobile-trace-main">
        <Link to={`/traces/${trace.traceId}`}>{trace.traceId}</Link>
        <button type="button" onClick={() => onCopy(trace.traceId)} aria-label={`Copy ${trace.traceId}`}>
          <Icon name="copy" size={15} />
        </button>
      </span>
      <span className="mobile-trace-time">{formatDateTime(trace.timestamp)}</span>
      <span className="mobile-trace-meta">
        {formatDuration(trace.overallDuration || 0)}
        <span aria-hidden="true">•</span>
        {trace.spanCount} spans
        {trace.rootService ? (
          <>
            <span aria-hidden="true">•</span>
            {trace.rootService}
          </>
        ) : null}
      </span>
    </div>
    <TraceStatusBadge status={trace.status} />
    <Link className="mobile-trace-chevron" to={`/traces/${trace.traceId}`} aria-label={`Open ${trace.traceId}`}>
      <Icon name="chevronRight" size={18} />
    </Link>
  </article>
)
