import { TRACE_STATUS_OPTIONS } from '../../constants/trace'
import { Icon } from '../common/Icon'
import { MobileFilterSheet } from './MobileFilterSheet'

export const TraceFilters = ({
  filters,
  services,
  showAdvanced,
  onFilterChange,
  onToggleAdvanced,
  onReset,
  onApplyMobileFilters,
}) => (
  <section className="filter-card">
    <div className="filter-toolbar">
      <label className="field search-field">
        <Icon name="search" />
        <input
          value={filters.traceId}
          onChange={(event) => onFilterChange('traceId', event.target.value)}
          placeholder="Search by trace ID..."
        />
      </label>

      <label className="field select-field">
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
        <Icon name="chevronDown" />
      </label>

      <label className="field select-field">
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
        <Icon name="chevronDown" />
      </label>

      <button className="field time-filter" type="button" disabled title="Time filtering is not supported by the current traces API">
        <Icon name="calendar" />
        <span>Last 24 hours</span>
        <Icon name="chevronDown" />
      </button>

      <button className="field more-filters" type="button" onClick={onToggleAdvanced}>
        <Icon name="filter" />
        <span>More Filters</span>
      </button>

      <button className="reset-button" type="button" onClick={onReset}>
        <Icon name="refresh" />
        <span>Reset</span>
      </button>
    </div>

    {showAdvanced ? (
      <div className="advanced-filters">
        <label>
          <span>Min duration</span>
          <input
            type="number"
            min="0"
            value={filters.minDuration}
            onChange={(event) => onFilterChange('minDuration', event.target.value)}
            placeholder="0 ms"
          />
        </label>
        <label>
          <span>Max duration</span>
          <input
            type="number"
            min="0"
            value={filters.maxDuration}
            onChange={(event) => onFilterChange('maxDuration', event.target.value)}
            placeholder="2000 ms"
          />
        </label>
      </div>
    ) : null}
    <MobileFilterSheet
      open={showAdvanced}
      filters={filters}
      services={services}
      onFilterChange={onFilterChange}
      onApply={onApplyMobileFilters}
      onClose={onToggleAdvanced}
      onReset={onReset}
    />
  </section>
)
