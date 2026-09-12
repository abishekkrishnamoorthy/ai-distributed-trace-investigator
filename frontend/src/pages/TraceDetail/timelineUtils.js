export const getStatusClass = (status) => {
  if (status === 'ERROR') {
    return 'error'
  }

  if (status === 'OK') {
    return 'ok'
  }

  return 'unknown'
}

export const getRoundedTimelineMax = (duration) => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 1000
  }

  const intervalCount = 5
  const rawStep = duration / intervalCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const roundedStep =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 3
            ? 3
            : normalized <= 4
              ? 4
              : normalized <= 5
                ? 5
                : 10

  return roundedStep * magnitude * intervalCount
}

export const createScaleMarkers = (max) => {
  const step = max / 5

  return Array.from({ length: 6 }, (_, index) => Math.round(step * index))
}

export const getBarWidth = (duration, max) => {
  if (!Number.isFinite(duration) || !Number.isFinite(max) || max <= 0) {
    return 0
  }

  return Math.min(Math.max((duration / max) * 100, duration > 0 ? 2 : 0), 100)
}

export const flattenSpans = (spans = [], depth = 0) =>
  spans.flatMap((span) => [
    { ...span, depth },
    ...flattenSpans(span.children || [], depth + 1),
  ])

export const getInitialExpandedState = (spans = []) => {
  const expanded = {}

  const visit = (span) => {
    if ((span.children || []).length > 0) {
      expanded[span.spanId] = true
      span.children.forEach(visit)
    }
  }

  spans.forEach(visit)
  return expanded
}

export const getVisibleTimelineRows = (
  spans = [],
  expanded,
  depth = 0,
  ancestorContinuations = [],
) =>
  spans.flatMap((span, index) => {
    const children = span.children || []
    const isLast = index === spans.length - 1
    const row = {
      ...span,
      depth,
      isLast,
      ancestorContinuations,
      hasChildren: children.length > 0,
      expanded: Boolean(expanded[span.spanId]),
    }

    if (!row.hasChildren || !row.expanded) {
      return [row]
    }

    return [
      row,
      ...getVisibleTimelineRows(children, expanded, depth + 1, [
        ...ancestorContinuations,
        !isLast,
      ]),
    ]
  })

export const groupServices = (spans = []) => {
  const rows = flattenSpans(spans)

  return rows.reduce((services, span) => {
    const existing = services.get(span.service) || { count: 0, hasError: false }

    services.set(span.service, {
      count: existing.count + 1,
      hasError: existing.hasError || span.status === 'ERROR',
    })

    return services
  }, new Map())
}
