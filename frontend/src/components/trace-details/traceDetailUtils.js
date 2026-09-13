import { formatDuration } from '../../utils/formatDuration'

export const formatMs = (durationMs) =>
  Number.isFinite(durationMs) ? `${durationMs.toLocaleString()} ms` : '-'

export const formatCandidateDuration = (durationMs) => {
  if (!Number.isFinite(durationMs)) {
    return '-'
  }

  return `${durationMs.toLocaleString()} ms (${formatDuration(durationMs)})`
}

export const flattenSpanTree = (spans = []) =>
  spans.flatMap((span) => [span, ...flattenSpanTree(span.children || [])])
