import { formatDuration } from '../../utils/formatDuration'

export const DurationBar = ({ duration, maxDuration }) => {
  const width = maxDuration > 0 ? Math.max((duration / maxDuration) * 100, 6) : 0

  return (
    <div className="duration-cell">
      <span>{formatDuration(duration)}</span>
      <span className="duration-track">
        <span style={{ width: `${width}%` }} />
      </span>
    </div>
  )
}
