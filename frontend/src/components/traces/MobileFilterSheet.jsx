import { TRACE_STATUS_OPTIONS } from '../../constants/trace'
import { Icon } from '../common/Icon'

export const MobileFilterSheet = ({
  open,
  filters,
  services,
  onFilterChange,
  onApply,
  onClose,
  onReset,
}) => (
  <>
    <button
      className={`sheet-backdrop ${open ? 'open' : ''}`}
      type="button"
      onClick={onClose}
      aria-label="Close filters"
    />
    <aside className={`mobile-filter-sheet ${open ? 'open' : ''}`} aria-hidden={!open}>
      <span className="sheet-handle" />
      <div className="sheet-header">
        <h2>Filters</h2>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close filters">
          <Icon name="x" />
        </button>
      </div>

      <div className="sheet-fields">
        <label>
          <span>Trace ID</span>
          <input
            value={filters.traceId}
            onChange={(event) => onFilterChange('traceId', event.target.value)}
            placeholder="Search by trace ID..."
          />
        </label>

        <label>
          <span>Service</span>
          <select
            value={filters.service}
            onChange={(event) => onFilterChange('service', event.target.value)}
            aria-label="Filter by service"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.name} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange('status', event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            {TRACE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Time Range</span>
          <button type="button" disabled>
            <Icon name="calendar" />
            Last 24 hours
            <Icon name="chevronDown" />
          </button>
        </label>
      </div>

      <div className="sheet-actions">
        <button className="apply-filters-button" type="button" onClick={onApply}>
          Apply Filters
        </button>
        <button className="sheet-reset-button" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  </>
)
