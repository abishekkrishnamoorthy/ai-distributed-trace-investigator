import { Link } from 'react-router-dom'
import { Icon } from '../common/Icon'

const GuideStep = ({ children, number, title }) => (
  <section className="insight-guide-step">
    <span>{number}</span>
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  </section>
)

export const TraceSelectionGuide = ({ selectedCount = 0, onAnalyze, canAnalyze }) => (
  <div className="insight-guide-card">
    <GuideStep number="1" title="Select Traces">
      <p>Go to the Traces page, select multiple traces using the checkboxes, and click "Analyze Selected".</p>
      <div className="insight-info">
        <Icon name="info" size={18} />
        <span>Select at least 2 traces to get more meaningful insights.</span>
      </div>
      <Link className="insight-primary-link" to="/traces">
        <span>Go to Traces</span>
        <Icon name="arrowRight" size={18} />
      </Link>
    </GuideStep>

    <GuideStep number="2" title="Analyze Selected Traces">
      <p>After selecting traces, click the button below to start AI analysis.</p>
      <button className="analyze-button insight-analyze-button" type="button" disabled={!canAnalyze} onClick={onAnalyze}>
        <Icon name="ai" size={19} />
        <span>Analyze Selected</span>
      </button>
      <small>
        {selectedCount > 0
          ? `${selectedCount} ${selectedCount === 1 ? 'trace' : 'traces'} selected.`
          : 'No traces selected. Please select traces from the Traces page.'}
      </small>
    </GuideStep>

    <GuideStep number="3" title="View Results">
      <p>Once the analysis is complete, you will see insights for each selected trace below.</p>
      <div className="insight-empty-result">
        <span>
          <Icon name="layers" size={38} />
        </span>
        <strong>No Analysis Yet</strong>
        <p>Select multiple traces from the Traces page and click "Analyze Selected" to get started.</p>
        <Link to="/traces">
          <span>Go to Traces</span>
          <Icon name="arrowRight" size={17} />
        </Link>
      </div>
    </GuideStep>
  </div>
)
