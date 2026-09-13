import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '../common/Icon'
import { formatDateTime } from '../../utils/date'

const formatPayloadSize = (payload) => {
  const bytes = new Blob([payload]).size

  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

const escapeJsonText = (value) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[char]
  })

const highlightJsonLine = (line) => {
  const tokenPattern =
    /(?:"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:])/g
  let highlighted = ''
  let lastIndex = 0

  line.replace(tokenPattern, (token, offset) => {
    highlighted += escapeJsonText(line.slice(lastIndex, offset))
    let type = 'punctuation'

    if (token.startsWith('"') && line.slice(offset + token.length).trimStart().startsWith(':')) {
      type = 'key'
    } else if (token.startsWith('"')) {
      type = 'string'
    } else if (token === 'true' || token === 'false') {
      type = 'boolean'
    } else if (token === 'null') {
      type = 'null'
    } else if (/^-?\d/.test(token)) {
      type = 'number'
    }

    highlighted += `<span class="json-token json-${type}">${escapeJsonText(token)}</span>`
    lastIndex = offset + token.length
    return token
  })

  highlighted += escapeJsonText(line.slice(lastIndex))
  return highlighted
}

const getTraceIdFromRawResponse = (rawData) => rawData?.data?.traceId || rawData?.traceId || 'trace'

const RawJsonViewer = ({ json }) => {
  const lines = json.split('\n')

  return (
    <div className="raw-json-viewer">
      <div className="raw-json-line-numbers" aria-hidden="true">
        {lines.map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <pre className="raw-json-code">
        <code>
          {lines.map((line, index) => (
            <span
              className="raw-json-line"
              dangerouslySetInnerHTML={{ __html: highlightJsonLine(line) }}
              key={`${index}-${line}`}
            />
          ))}
        </code>
      </pre>
    </div>
  )
}

const RawDataActions = ({ copiedState, onCopy, onDownload, onFormat, onExpand, compact = false }) => (
  <div className="raw-data-actions">
    <button type="button" onClick={onCopy} title={copiedState === 'error' ? 'Unable to copy' : 'Copy JSON'}>
      <Icon name={copiedState === 'success' ? 'check' : 'copy'} size={compact ? 18 : 17} />
      <span>{copiedState === 'success' ? 'Copied' : copiedState === 'error' ? 'Unable to copy' : 'Copy'}</span>
    </button>
    <button type="button" onClick={onDownload} title="Download JSON">
      <Icon name="download" size={compact ? 18 : 17} />
      <span>Download</span>
    </button>
    <button type="button" onClick={onFormat} title="Format JSON">
      <Icon name="code" size={compact ? 18 : 17} />
      <span>Format</span>
    </button>
    <button type="button" onClick={onExpand} title="Expand raw JSON" aria-label="Expand raw JSON">
      <Icon name="maximize" size={compact ? 18 : 17} />
      <span className="raw-expand-label">Expand</span>
    </button>
  </div>
)

export const RawDataPanel = ({ rawData, fetchedAt }) => {
  const { showToast } = useOutletContext()
  const [copiedState, setCopiedState] = useState('idle')
  const [formatError, setFormatError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(rawData, null, 2)
    } catch {
      return ''
    }
  }, [rawData])

  useEffect(() => {
    if (!expanded) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [expanded])

  useEffect(() => {
    if (copiedState === 'idle') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setCopiedState('idle'), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copiedState])

  if (!rawData) {
    return (
      <div className="raw-data-layout single">
        <section className="raw-data-card">
          <div className="raw-empty-state">
            <strong>Raw trace data unavailable</strong>
            <p>The trace data could not be loaded for this trace.</p>
          </div>
        </section>
      </div>
    )
  }

  const traceId = getTraceIdFromRawResponse(rawData)
  const payloadSize = formattedJson ? formatPayloadSize(formattedJson) : '-'
  const source = `/api/traces/${traceId}`
  const fetchedLabel = fetchedAt ? formatDateTime(fetchedAt) : null

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      setCopiedState('error')
      showToast('Unable to copy raw trace data')
      return
    }

    try {
      await navigator.clipboard.writeText(formattedJson)
      setCopiedState('success')
      showToast('Raw trace data copied')
    } catch {
      setCopiedState('error')
      showToast('Unable to copy raw trace data')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${traceId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFormat = () => {
    try {
      JSON.parse(formattedJson)
      setFormatError('')
      showToast('Raw trace data formatted')
    } catch {
      setFormatError('Unable to format raw trace data because it is not valid JSON.')
    }
  }

  const actionProps = {
    copiedState,
    onCopy: handleCopy,
    onDownload: handleDownload,
    onFormat: handleFormat,
    onExpand: () => setExpanded(true),
  }

  const rawCard = (
    <section className="raw-data-card">
      <header className="raw-data-card-header">
        <div>
          <h2>Raw Trace Data</h2>
          <p>Complete trace data as received from the backend API.</p>
        </div>
        <RawDataActions {...actionProps} />
      </header>
      {formatError ? <p className="raw-format-error">{formatError}</p> : null}
      {formattedJson && !expanded ? (
        <RawJsonViewer json={formattedJson} />
      ) : formattedJson ? (
        <div className="raw-viewer-placeholder" aria-hidden="true" />
      ) : (
        <div className="raw-empty-state">
          <strong>Raw trace data unavailable</strong>
          <p>The trace data could not be loaded for this trace.</p>
        </div>
      )}
    </section>
  )

  return (
    <>
      <div className="raw-data-layout">
        {rawCard}
        <aside className="raw-about-card">
          <header>
            <span>
              <Icon name="info" size={20} />
            </span>
            <h2>About This Data</h2>
          </header>
          <p>
            This is the raw trace data returned by the backend API for <code>{traceId}</code>.
          </p>
          <dl>
            <div>
              <dt>Format</dt>
              <dd>JSON</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{source}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{payloadSize}</dd>
            </div>
            {fetchedLabel ? (
              <div>
                <dt>Fetched At</dt>
                <dd>{fetchedLabel}</dd>
              </div>
            ) : null}
          </dl>
          <div className="raw-info-callout">
            <Icon name="info" size={19} />
            <p>This is the exact data used to generate the trace view, metrics, and AI analysis.</p>
          </div>
        </aside>
      </div>

      {expanded ? (
        <div className="raw-data-modal" role="dialog" aria-modal="true" aria-label="Expanded raw trace data">
          <section className="raw-data-modal-panel">
            <header className="raw-data-card-header">
              <div>
                <h2>Raw Trace Data</h2>
                <p>Complete trace data as received from the backend API.</p>
              </div>
              <div className="raw-modal-actions">
                <RawDataActions {...actionProps} compact />
                <button className="raw-close-button" type="button" onClick={() => setExpanded(false)}>
                  <Icon name="x" size={19} />
                  <span>Close</span>
                </button>
              </div>
            </header>
            {formatError ? <p className="raw-format-error">{formatError}</p> : null}
            <RawJsonViewer json={formattedJson} />
          </section>
        </div>
      ) : null}
    </>
  )
}
