export const formatCount = (value) => {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return new Intl.NumberFormat('en-US').format(value)
}
