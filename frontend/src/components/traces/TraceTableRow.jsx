import { Link } from 'react-router-dom'
import { formatDateTime, formatRelativeTime } from '../../utils/date'
import { Icon } from '../common/Icon'
import { DurationBar } from './DurationBar'
import { TraceStatusBadge } from './TraceStatusBadge'

export const TraceTableRow = ({ trace, selected, maxDuration, onCopy, onToggleTrace }) => (
  <tr>
    <td className="checkbox-cell">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleTrace(trace.traceId)}
        aria-label={`Select ${trace.traceId}`}
      />
    </td>
    <td>
      <div className="trace-id-cell">
        <Link to={`/traces/${trace.traceId}`}>{trace.traceId}</Link>
        <button type="button" onClick={() => onCopy(trace.traceId)} aria-label={`Copy ${trace.traceId}`}>
          <Icon name="copy" size={16} />
        </button>
      </div>
    </td>
    <td>
      <div className="time-cell">
        <span>{formatDateTime(trace.timestamp)}</span>
        <small>{formatRelativeTime(trace.timestamp)}</small>
      </div>
    </td>
    <td>
      <DurationBar duration={trace.overallDuration || 0} maxDuration={maxDuration} />
    </td>
    <td><TraceStatusBadge status={trace.status} /></td>
    <td>{trace.spanCount}</td>
    <td>{trace.rootService}</td>
  </tr>
)
