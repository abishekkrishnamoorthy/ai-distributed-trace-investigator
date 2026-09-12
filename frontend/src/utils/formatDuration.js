export const formatDuration = (duration) => {
  if (!Number.isFinite(duration)) {
    return '0 ms'
  }

  return duration >= 1000 ? `${(duration / 1000).toFixed(1)} s` : `${duration} ms`
}
