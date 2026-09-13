import { Icon } from '../common/Icon'

const TRACE_TABS = [
  { id: 'timeline', label: 'Timeline', icon: 'list', selectable: true },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'barChart', selectable: true },
  { id: 'spans', label: 'Spans', icon: 'share', selectable: true },
  { id: 'raw', label: 'Raw Data', icon: 'code', selectable: true },
  { id: 'analysis', label: 'AI Analysis', icon: 'ai', selectable: true },
]

export const TraceTabs = ({ activeTab, onTabChange }) => (
  <nav className="trace-tabs" aria-label="Trace detail tabs">
    {TRACE_TABS.map((tab) => (
      <button
        className={activeTab === tab.id ? 'active' : ''}
        type="button"
        key={tab.id}
        onClick={() => {
          if (tab.selectable) {
            onTabChange(tab.id)
          }
        }}
      >
        <Icon name={tab.icon} size={20} />
        <span>{tab.label}</span>
      </button>
    ))}
  </nav>
)
