import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AIAnalysisResult } from '../trace-details/AIAnalysisPanel'
import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { formatDateTime, formatRelativeTime } from '../../utils/date'

const getTraceForResult = (result, traceDetails) =>
  traceDetails.find((item) => item.traceId === result.traceId)?.trace || { traceId: result.traceId, spans: [] }

const MultipleTraceResult = ({ defaultOpen, result, trace }) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <article className="multi-trace-result">
      <header className="multi-trace-result-header">
        <div>
          <h2>
            Trace: {result.traceId}
            {trace.status ? <TraceStatusBadge status={trace.status} /> : null}
          </h2>
          <p>
            {trace.timestamp ? formatDateTime(trace.timestamp) : 'Trace metadata unavailable'}
            {trace.timestamp ? ` (${formatRelativeTime(trace.timestamp)})` : ''}
          </p>
        </div>
        <div className="multi-result-actions">
          <Link to={`/traces/${result.traceId}`}>
            <span>View Trace Details</span>
            <Icon name="arrowRight" size={17} />
          </Link>
          <button type="button" onClick={() => setOpen((current) => !current)} aria-label={`${open ? 'Collapse' : 'Expand'} ${result.traceId}`}>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} />
          </button>
        </div>
      </header>

      {open && result.status === 'success' ? (
        <AIAnalysisResult analysis={result.analysis} trace={trace} />
      ) : open ? (
        <div className="multi-trace-error">
          <Icon name="warning" size={22} />
          <div>
            <strong>Trace analysis unavailable</strong>
            <p>{result.error || 'This trace did not return valid AI analysis.'}</p>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export const MultipleTraceResults = ({ results, traceDetails }) => {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="multi-trace-results">
      {results.map((result, index) => (
        <MultipleTraceResult
          defaultOpen={index === 0}
          key={result.traceId}
          result={result}
          trace={getTraceForResult(result, traceDetails)}
        />
      ))}
    </div>
  )
}
