import { Icon } from '../common/Icon'
import { LoadingSkeleton } from '../common/LoadingSkeleton'

export const TraceStatCard = ({ icon, label, value, tone, meta, loading, error }) => (
  <article className="stat-card">
    <span className={`stat-icon ${tone}`}>
      <Icon name={icon} />
    </span>
    <div className="stat-content">
      {loading ? (
        <>
          <LoadingSkeleton className="stat-value-skeleton" />
          <LoadingSkeleton className="stat-label-skeleton" />
        </>
      ) : error ? (
        <>
          <strong className="stat-value muted-text">--</strong>
          <span className="stat-label">Unavailable</span>
        </>
      ) : (
        <>
          <strong className="stat-value">{value}</strong>
          <span className="stat-label">{label}</span>
        </>
      )}
    </div>
    {!loading && !error && meta ? <span className={`stat-meta ${tone}`}>{meta}</span> : null}
  </article>
)
