import { Link } from 'react-router-dom'
import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { formatDateTime, formatRelativeTime } from '../../utils/date'

export const TraceHeader = ({ trace }) => {
  const relativeTime = formatRelativeTime(trace.timestamp)

  return (
    <>
      <div className="trace-detail-topline">
        <Link to="/traces">
          <Icon name="chevronLeft" size={20} />
          Back to Traces
        </Link>
        <button className="trace-more-button" type="button" aria-label="More trace actions">
          ...
        </button>
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
    </>
  )
}
