import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { formatDateTime } from '../../utils/date'
import { formatDuration } from '../../utils/formatDuration'

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

export const TraceStats = ({ trace }) => (
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
)
