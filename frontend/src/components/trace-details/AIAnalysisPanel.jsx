import { useMemo } from 'react'
import { Icon } from '../common/Icon'
import { TraceStatusBadge } from '../traces/TraceStatusBadge'
import { isValidAnalysis } from '../../utils/aiAnalysis'
import { formatDuration } from '../../utils/formatDuration'

const flattenSpanIds = (spans = []) =>
  spans.flatMap((span) => [span.spanId, ...flattenSpanIds(span.children || [])]).filter(Boolean)

const getEvidence = (evidence = [], validSpanIds) =>
  evidence.filter((spanId) => typeof spanId === 'string' && validSpanIds.has(spanId))

const EvidenceChips = ({ evidence, validSpanIds }) => {
  const filteredEvidence = getEvidence(evidence, validSpanIds)

  if (filteredEvidence.length === 0) {
    return null
  }

  return (
    <span className="ai-evidence-chips" aria-label="Evidence spans">
      {filteredEvidence.map((spanId) => (
        <span key={spanId}>[{spanId}]</span>
      ))}
    </span>
  )
}

const AIStatePanel = ({ buttonLabel = 'AI Analyse', description, loading = false, onAnalyze, title }) => (
  <section className={`ai-analysis-state ${loading ? 'loading' : ''}`} aria-live={loading ? 'polite' : undefined}>
    <span className="ai-state-icon">
      <Icon name="ai" size={34} />
    </span>
    <h2>{title}</h2>
    <p>{description}</p>
    {loading ? (
      <span className="ai-loading-dots" aria-label="Analysis in progress">
        <span />
        <span />
        <span />
      </span>
    ) : (
      <button
        className="analyze-button ai-analyse-button"
        type="button"
        onClick={onAnalyze}
        aria-label={buttonLabel}
      >
        <Icon name="ai" size={20} />
        <span>{buttonLabel}</span>
      </button>
    )}
  </section>
)

export const AnalysisSection = ({ children, className = '', subtitle, title }) => (
  <section className={`ai-analysis-card ${className}`}>
    <header className="ai-section-header">
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
    {children}
  </section>
)

export const FindingList = ({ items = [], tone, validSpanIds, withReason = false }) => {
  if (items.length === 0) {
    return <p className="ai-empty-copy">No items were returned for this section.</p>
  }

  return (
    <ol className={`ai-finding-list ${tone}`}>
      {items.map((item, index) => (
        <li key={`${item.statement}-${index}`}>
          <span className="ai-finding-index">{index + 1}</span>
          <div>
            <p>{item.statement}</p>
            {withReason && item.reason ? <small>{item.reason}</small> : null}
            <EvidenceChips evidence={item.evidence} validSpanIds={validSpanIds} />
          </div>
        </li>
      ))}
    </ol>
  )
}

export const BottleneckSection = ({ bottleneck, validSpanIds }) => {
  if (!bottleneck) {
    return (
      <AnalysisSection
        className="ai-bottleneck-card"
        subtitle="Primary bottleneck candidate identified from the analysis."
        title="Likely Bottleneck"
      >
        <p className="ai-empty-copy">
          No primary bottleneck candidate was identified from the available telemetry.
        </p>
      </AnalysisSection>
    )
  }

  return (
    <AnalysisSection
      className="ai-bottleneck-card has-bottleneck"
      subtitle="Primary bottleneck candidate identified from the analysis."
      title="Likely Bottleneck"
    >
      <div className="ai-bottleneck-heading">
        <span className="stat-icon red">
          <Icon name="warning" size={24} />
        </span>
        <div>
          <strong>{bottleneck.service || '-'}</strong>
          <span>{bottleneck.operation || '-'}</span>
        </div>
        {bottleneck.status ? <TraceStatusBadge status={bottleneck.status} /> : null}
      </div>

      <dl className="ai-bottleneck-meta">
        <div>
          <dt>Span ID</dt>
          <dd>{bottleneck.spanId || '-'}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>
            {Number.isFinite(bottleneck.durationMs)
              ? `${bottleneck.durationMs.toLocaleString()} ms (${formatDuration(bottleneck.durationMs)})`
              : '-'}
          </dd>
        </div>
      </dl>

      {bottleneck.reason ? <p className="ai-bottleneck-reason">{bottleneck.reason}</p> : null}
      <EvidenceChips evidence={bottleneck.evidence} validSpanIds={validSpanIds} />
    </AnalysisSection>
  )
}

export const AIAnalysisResult = ({ analysis, trace }) => {
  const validSpanIds = useMemo(() => new Set(flattenSpanIds(trace.spans || [])), [trace.spans])
  const validAnalysis = isValidAnalysis(analysis) ? analysis : null

  if (!validAnalysis) {
    return null
  }

  return (
    <div className="ai-analysis-panel">
      <header className="ai-analysis-header">
        <span className="ai-state-icon">
          <Icon name="ai" size={28} />
        </span>
        <div>
          <h2>AI Analysis</h2>
          <p>AI-powered analysis based on trace telemetry data.</p>
        </div>
        <div className="ai-analysis-meta">
          <span>Generated from trace data</span>
          <strong>Trace ID: {trace.traceId}</strong>
        </div>
      </header>

      <div className="ai-analysis-grid">
        <AnalysisSection
          className={`ai-summary-card ${trace.status === 'ERROR' ? 'error' : ''}`}
          subtitle="Overview of the trace and its most important observations."
          title="Summary"
        >
          <p>{validAnalysis.summary}</p>
        </AnalysisSection>

        <BottleneckSection bottleneck={validAnalysis.bottleneck} validSpanIds={validSpanIds} />

        <AnalysisSection
          subtitle="Key facts directly from the trace data."
          title="Observed Facts"
        >
          <FindingList items={validAnalysis.observedFacts} tone="facts" validSpanIds={validSpanIds} />
        </AnalysisSection>

        <AnalysisSection
          subtitle="Insights inferred from the trace data."
          title="AI Interpretation"
        >
          <FindingList items={validAnalysis.interpretation} tone="interpretation" validSpanIds={validSpanIds} />
        </AnalysisSection>

        <AnalysisSection
          className="ai-recommendations-card"
          subtitle="Recommended next steps to investigate and resolve the issue."
          title="Recommendations"
        >
          <FindingList
            items={validAnalysis.recommendations}
            tone="recommendations"
            validSpanIds={validSpanIds}
            withReason
          />
        </AnalysisSection>
      </div>
    </div>
  )
}

export const AIAnalysisPanel = ({ analysis, onAnalyze, status, trace }) => {
  const validAnalysis = isValidAnalysis(analysis) ? analysis : null

  if (status === 'loading') {
    return (
      <AIStatePanel
        description="AI is reviewing the available telemetry and generating grounded insights..."
        loading
        title="Analyzing Trace"
      />
    )
  }

  if (status === 'error') {
    return (
      <AIStatePanel
        buttonLabel="Try Again"
        description="Unable to analyze this trace right now. Please try again."
        onAnalyze={onAnalyze}
        title="AI Analysis Failed"
      />
    )
  }

  if (status === 'invalid' || (status === 'success' && !validAnalysis)) {
    return (
      <AIStatePanel
        buttonLabel="Try Again"
        description="Valid analysis data was not returned for this trace."
        onAnalyze={onAnalyze}
        title="AI Analysis Unavailable"
      />
    )
  }

  if (!validAnalysis) {
    return (
      <AIStatePanel
        description="Analyze this trace to identify important observations, likely bottlenecks, and recommended investigation steps."
        onAnalyze={onAnalyze}
        title="AI Analysis"
      />
    )
  }

  return <AIAnalysisResult analysis={validAnalysis} trace={trace} />
}
