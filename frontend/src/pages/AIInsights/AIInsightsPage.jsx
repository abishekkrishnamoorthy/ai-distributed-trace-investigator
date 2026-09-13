import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/common/Icon'
import { MultipleTraceIntro } from '../../components/ai-insights/MultipleTraceIntro'
import { TraceSelectionGuide } from '../../components/ai-insights/TraceSelectionGuide'
import {
  MultipleAnalysisError,
  MultipleAnalysisLoading,
  MultipleAnalysisSuccess,
} from '../../components/ai-insights/MultipleAnalysisStatus'
import { MultipleTraceResults } from '../../components/ai-insights/MultipleTraceResults'
import { useMultipleTraceAnalysis } from '../../hooks/useMultipleTraceAnalysis'

export const AIInsightsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedFromRoute = Array.isArray(location.state?.traceIds) ? location.state.traceIds : []
  const {
    analyzedAt,
    analyze,
    canAnalyze,
    error,
    reset,
    results,
    selectedTraceIds,
    status,
    traceDetails,
  } = useMultipleTraceAnalysis(selectedFromRoute)

  const handleAnalyzeNewTraces = () => {
    reset()
    navigate('/traces')
  }

  return (
    <section className="content ai-insights-page">
      <header className="ai-insights-header">
        <div>
          <h1>AI Insights</h1>
          <p>Use AI to analyze multiple traces and get insights, likely bottlenecks, and recommendations.</p>
        </div>
        <button className="analyze-button" type="button" onClick={handleAnalyzeNewTraces}>
          <Icon name="ai" size={19} />
          <span>Analyze New Traces</span>
        </button>
      </header>

      <MultipleTraceIntro />

      {status === 'loading' ? (
        <MultipleAnalysisLoading count={selectedTraceIds.length} />
      ) : null}

      {status === 'error' ? (
        <MultipleAnalysisError message={error} onRetry={analyze} />
      ) : null}

      {status === 'success' ? (
        <>
          <MultipleAnalysisSuccess analyzedAt={analyzedAt} traceIds={selectedTraceIds} />
          <MultipleTraceResults results={results} traceDetails={traceDetails} />
        </>
      ) : null}

      {status === 'idle' ? (
        <TraceSelectionGuide
          canAnalyze={canAnalyze}
          onAnalyze={analyze}
          selectedCount={selectedTraceIds.length}
        />
      ) : null}

      {status !== 'loading' ? (
        <button className="analyze-button ai-insights-mobile-new" type="button" onClick={handleAnalyzeNewTraces}>
          <Icon name="ai" size={19} />
          <span>Analyze New Traces</span>
        </button>
      ) : null}
    </section>
  )
}
