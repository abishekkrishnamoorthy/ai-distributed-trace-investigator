export const DEFAULT_TRACE_STATS = {
  totalTraces: 0,
  successfulTraces: 0,
  errorTraces: 0,
  averageDuration: 0,
  successRate: 0,
  errorRate: 0,
}

export const DEFAULT_TRACE_FILTERS = {
  traceId: '',
  service: '',
  status: '',
  minDuration: '',
  maxDuration: '',
}

export const DEFAULT_TRACE_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

export const DEFAULT_TRACE_SORT = {
  sortBy: 'timestamp',
  order: 'desc',
}

export const TRACE_STATUS_OPTIONS = ['OK', 'ERROR']
