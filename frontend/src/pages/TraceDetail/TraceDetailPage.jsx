import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { AIAnalysisPanel } from '../../components/trace-details/AIAnalysisPanel'
import { DiagnosticsPanel } from '../../components/trace-details/DiagnosticsPanel'
import { RawDataPanel } from '../../components/trace-details/RawDataPanel'
import { SpansPanel } from '../../components/trace-details/SpansPanel'
import { TraceHeader } from '../../components/trace-details/TraceHeader'
import { TraceStats } from '../../components/trace-details/TraceStats'
import { TraceTabs } from '../../components/trace-details/TraceTabs'
import { ServicesInTrace, TimelinePanel } from '../../components/trace-details/TimelinePanel'
import { useAIAnalysisCache } from '../../hooks/useAIAnalysisCache'
import { traceApi } from '../../services/traceApi'
import { isValidAnalysis } from '../../utils/aiAnalysis'

export const TraceDetailPage = () => {
  const { traceId } = useParams()
  const [trace, setTrace] = useState(null)
  const [rawTraceResponse, setRawTraceResponse] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [analysisStatusByTraceId, setAnalysisStatusByTraceId] = useState({})
  const analysisRequestsInFlight = useRef(new Set())
  const { getCachedAnalysis, setCachedAnalysis } = useAIAnalysisCache()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')

  useEffect(() => {
    let active = true

    const loadTrace = async () => {
      setLoading(true)
      setError(false)

      try {
        const response = await traceApi.getTraceById(traceId)

        if (active) {
          setRawTraceResponse(response)
          setTrace(response.data)
          setFetchedAt(new Date().toISOString())
        }
      } catch {
        if (active) {
          setError(true)
          setRawTraceResponse(null)
          setFetchedAt(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTrace()

    return () => {
      active = false
    }
  }, [traceId])

  const currentAnalysis = trace ? getCachedAnalysis(trace.traceId) : null
  const savedAnalysisStatus = trace ? analysisStatusByTraceId[trace.traceId] : null
  const analysisStatus = ['loading', 'error', 'invalid'].includes(savedAnalysisStatus)
    ? savedAnalysisStatus
    : currentAnalysis
      ? 'success'
      : 'idle'

  const analyzeTrace = useCallback(async () => {
    const requestedTraceId = trace?.traceId

    if (!requestedTraceId || analysisStatus === 'loading' || analysisRequestsInFlight.current.has(requestedTraceId)) {
      return
    }

    analysisRequestsInFlight.current.add(requestedTraceId)
    setAnalysisStatusByTraceId((current) => ({
      ...current,
      [requestedTraceId]: 'loading',
    }))

    try {
      const response = await traceApi.analyzeTraces([requestedTraceId])
      const result = response?.data?.find((item) => item?.traceId === requestedTraceId) || response?.data?.[0]

      if (!result?.analysis) {
        setAnalysisStatusByTraceId((current) => ({
          ...current,
          [requestedTraceId]: 'invalid',
        }))
        return
      }

      if (!isValidAnalysis(result.analysis)) {
        setAnalysisStatusByTraceId((current) => ({
          ...current,
          [requestedTraceId]: 'invalid',
        }))
        return
      }

      setCachedAnalysis(requestedTraceId, result.analysis)
      setAnalysisStatusByTraceId((current) => ({
        ...current,
        [requestedTraceId]: 'success',
      }))
    } catch {
      setAnalysisStatusByTraceId((current) => ({
        ...current,
        [requestedTraceId]: 'error',
      }))
    } finally {
      analysisRequestsInFlight.current.delete(requestedTraceId)
    }
  }, [analysisStatus, setCachedAnalysis, trace])

  const tabContent = useMemo(() => {
    if (!trace) {
      return null
    }

    if (activeTab === 'diagnostics') {
      return <DiagnosticsPanel trace={trace} />
    }

    if (activeTab === 'spans') {
      return <SpansPanel trace={trace} />
    }

    if (activeTab === 'raw') {
      return <RawDataPanel key={trace.traceId} rawData={rawTraceResponse} fetchedAt={fetchedAt} />
    }

    if (activeTab === 'analysis') {
      return (
        <AIAnalysisPanel
          analysis={currentAnalysis}
          onAnalyze={analyzeTrace}
          status={analysisStatus}
          trace={trace}
        />
      )
    }

    return (
      <div className="trace-timeline-layout">
        <TimelinePanel key={trace.traceId} trace={trace} />
        <ServicesInTrace trace={trace} />
      </div>
    )
  }, [activeTab, analysisStatus, analyzeTrace, currentAnalysis, fetchedAt, rawTraceResponse, trace])

  if (loading) {
    return (
      <section className="content trace-detail-page">
        <LoadingSkeleton className="trace-detail-loading" />
      </section>
    )
  }

  if (error || !trace) {
    return (
      <section className="content trace-detail-page">
        <ErrorState title="Trace not found" onAction={() => window.location.reload()} />
      </section>
    )
  }

  return (
    <section className="content trace-detail-page">
      <TraceHeader trace={trace} />
      <TraceStats trace={trace} />
      <TraceTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {tabContent}
    </section>
  )
}
