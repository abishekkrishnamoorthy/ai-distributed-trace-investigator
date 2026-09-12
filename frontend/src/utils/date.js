export const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) {
    return ''
  }

  const diffMs = Date.now() - new Date(timestamp).getTime()
  const absMs = Math.abs(diffMs)
  const units = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (const [unit, ms] of units) {
    if (absMs >= ms) {
      return formatter.format(Math.round(diffMs / ms) * -1, unit)
    }
  }

  return formatter.format(0, 'minute')
}
