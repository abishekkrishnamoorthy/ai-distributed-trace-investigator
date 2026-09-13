import { Icon } from '../common/Icon'

const FILTER_LABELS = {
  status: 'Status',
  service: 'Service',
  minDurationMs: 'Duration >=',
  maxDurationMs: 'Duration <=',
}

const formatFilterValue = (key, value) => {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  if (key === 'minDurationMs' || key === 'maxDurationMs') {
    return `${value} ms`
  }

  return String(value)
}

const getFilterEntries = (filters) => (
  Object.entries(filters || {})
    .map(([key, value]) => ({
      key,
      label: FILTER_LABELS[key] || key,
      value: formatFilterValue(key, value),
    }))
    .filter((filter) => filter.value)
)

export const AISearchPanel = ({
  value,
  filters,
  isActive,
  loading,
  error,
  onChange,
  onSubmit,
  onReset,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(value)
  }

  const filterEntries = getFilterEntries(filters)

  return (
    <section className="ai-search-panel">
      <div className="ai-search-copy">
        <span className="ai-icon">
          <Icon name="ai" size={28} />
        </span>
        <span>
          <strong>AI Search</strong>
          <small>Use natural language to search traces, find errors, or get insights.</small>
        </span>
      </div>
      <form className="ai-search-form" onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='Ask anything... e.g. "show error traces from payment service"'
          aria-label="AI Search"
          disabled={loading}
        />
        <button type="submit" aria-label="Submit AI Search" disabled={loading || !value.trim()}>
          <Icon name="arrowRight" />
        </button>
        {(isActive || value || error) ? (
          <button className="ai-search-reset" type="button" onClick={onReset} disabled={loading}>
            Clear
          </button>
        ) : null}
        {loading ? <small className="ai-search-status">Searching traces...</small> : null}
        {!loading && error ? <small className="ai-search-status error">{error}</small> : null}
        {!loading && filterEntries.length > 0 ? (
          <div className="ai-search-filters" aria-label="Interpreted AI Search filters">
            {filterEntries.map((filter) => (
              <span key={filter.key}>{filter.label}: {filter.value}</span>
            ))}
          </div>
        ) : null}
      </form>
    </section>
  )
}
