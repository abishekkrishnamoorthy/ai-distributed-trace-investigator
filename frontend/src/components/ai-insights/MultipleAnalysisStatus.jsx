import { Icon } from '../common/Icon'
import { formatDateTime } from '../../utils/date'

const stages = [
  'Preparing trace data...',
  'Analyzing telemetry...',
  'Generating insights...',
  'Finalizing results...',
]

export const MultipleAnalysisLoading = ({ count }) => (
  <section className="multi-analysis-loading">
    <span className="multi-loading-orb">
      <Icon name="layers" size={46} />
    </span>
    <h2>Analyzing Selected Traces</h2>
    <p>Analyzing {count} selected {count === 1 ? 'trace' : 'traces'}...</p>
    <ol>
      {stages.map((stage) => (
        <li key={stage}>{stage}</li>
      ))}
    </ol>
  </section>
)

export const MultipleAnalysisSuccess = ({ analyzedAt, traceIds }) => (
  <section className="multi-analysis-success">
    <span className="status-dot success">
      <Icon name="check" size={18} />
    </span>
    <div>
      <h2>Analysis Complete</h2>
      <p>AI analysis completed successfully for {traceIds.length} selected traces.</p>
    </div>
    <div className="multi-success-meta">
      <strong>Analyzed {traceIds.length} traces</strong>
      <span className="trace-chip-row">
        {traceIds.map((traceId) => (
          <span className="trace-chip" key={traceId}>{traceId}</span>
        ))}
      </span>
    </div>
    <time>
      <Icon name="calendar" size={18} />
      {formatDateTime(analyzedAt)}
    </time>
  </section>
)

export const MultipleAnalysisError = ({ message, onRetry }) => (
  <section className="multi-analysis-error">
    <span className="status-dot error">
      <Icon name="warning" size={18} />
    </span>
    <div>
      <h2>Analysis Failed</h2>
      <p>{message || 'Unable to analyze the selected traces right now. Please try again.'}</p>
    </div>
    <button className="trace-action-button" type="button" onClick={onRetry}>
      <span>Try Again</span>
      <Icon name="refresh" size={17} />
    </button>
  </section>
)
