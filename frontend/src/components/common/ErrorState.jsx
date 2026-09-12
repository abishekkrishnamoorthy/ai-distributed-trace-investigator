export const ErrorState = ({ title = 'Unable to load data', actionLabel = 'Try again', onAction }) => (
  <div className="state-panel">
    <strong>{title}</strong>
    {onAction ? <button type="button" onClick={onAction}>{actionLabel}</button> : null}
  </div>
)
