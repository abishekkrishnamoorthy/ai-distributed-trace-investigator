import { useState } from 'react'
import { Icon } from '../common/Icon'

export const AISearchPanel = ({ onNotice }) => {
  const [value, setValue] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setValue('')
    onNotice('AI Search is visual-only for now; no natural-language search endpoint exists yet.')
  }

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
          onChange={(event) => setValue(event.target.value)}
          placeholder='Ask anything... e.g. "show error traces from payment service"'
          aria-label="AI Search"
        />
        <button type="submit" aria-label="Submit AI Search">
          <Icon name="arrowRight" />
        </button>
      </form>
    </section>
  )
}
