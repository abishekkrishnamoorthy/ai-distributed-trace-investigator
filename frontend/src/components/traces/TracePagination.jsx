import { Icon } from '../common/Icon'

export const TracePagination = ({ pagination, loading, onPageChange, onLimitChange }) => {
  const page = pagination.page || 1
  const limit = pagination.limit || 10
  const total = pagination.total || 0
  const totalPages = pagination.totalPages || 1
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <footer className="pagination">
      <span>Showing {start}-{end} of {total} traces</span>
      <div className="pagination-controls">
        <label>
          Rows per page
          <select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} disabled={loading}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <button type="button" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <Icon name="chevronLeft" />
        </button>
        {pages.map((pageNumber) => (
          <button
            className={pageNumber === page ? 'active' : ''}
            key={pageNumber}
            type="button"
            disabled={loading}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button type="button" disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <Icon name="chevronRight" />
        </button>
      </div>
    </footer>
  )
}
