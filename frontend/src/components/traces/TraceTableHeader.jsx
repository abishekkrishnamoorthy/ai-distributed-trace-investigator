import { Icon } from '../common/Icon'

const SortHeader = ({ label, sort, field, onSort }) => {
  const supported = field === 'timestamp' || field === 'duration'
  const active = sort.sortBy === field

  if (!supported) {
    return <th>{label}</th>
  }

  return (
    <th>
      <button className={`sort-button ${active ? 'active' : ''}`} type="button" onClick={() => onSort(field)}>
        {label}
        <Icon name="sort" size={14} />
      </button>
    </th>
  )
}

export const TraceTableHeader = ({
  allVisibleSelected,
  someVisibleSelected,
  sort,
  onSort,
  onTogglePage,
}) => (
  <thead>
    <tr>
      <th className="checkbox-cell">
        <input
          type="checkbox"
          checked={allVisibleSelected}
          ref={(input) => {
            if (input) {
              input.indeterminate = !allVisibleSelected && someVisibleSelected
            }
          }}
          onChange={() => onTogglePage(!allVisibleSelected)}
          aria-label="Select all traces on this page"
        />
      </th>
      <th>Trace ID</th>
      <SortHeader label="Start Time" sort={sort} field="timestamp" onSort={onSort} />
      <SortHeader label="Duration" sort={sort} field="duration" onSort={onSort} />
      <th>Status</th>
      <th>Spans</th>
      <th>Root Service</th>
    </tr>
  </thead>
)
