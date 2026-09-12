export const TraceStatusBadge = ({ status }) => (
  <span
    className={`status-badge ${
      status === 'ERROR' ? 'status-error' : status === 'OK' ? 'status-ok' : 'status-unknown'
    }`}
  >
    {status}
  </span>
)
