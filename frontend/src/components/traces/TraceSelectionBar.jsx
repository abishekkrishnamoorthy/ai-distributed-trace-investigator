import { Icon } from '../common/Icon'

export const TraceSelectionBar = ({
  count,
  canAnalyze,
  canCompare,
  onClear,
  onAnalyze,
  onCompare,
}) => {
  if (count === 0) {
    return null
  }

  return (
    <div className="selection-bar">
      <div className="selection-summary">
        <span className="selection-check">
          <Icon name="check" size={14} />
        </span>
        <strong>{count} {count === 1 ? 'trace' : 'traces'} selected</strong>
        <button type="button" onClick={onClear}>Clear selection</button>
      </div>
      <div className="selection-actions">
        <button className="analyze-button" type="button" onClick={onAnalyze} disabled={!canAnalyze}>
          <Icon name="ai" />
          <span>Analyze Selected</span>
        </button>
        <button className="compare-button" type="button" onClick={onCompare} disabled={!canCompare}>
          <Icon name="network" />
          <span>Compare Selected</span>
        </button>
      </div>
    </div>
  )
}
