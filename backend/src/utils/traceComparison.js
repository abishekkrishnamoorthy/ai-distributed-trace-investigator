const roundPercent = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
};

const calculateDifferencePercent = (traceAValue, traceBValue) => {
  if (!Number.isFinite(traceAValue) || !Number.isFinite(traceBValue) || traceBValue === 0) {
    return null;
  }

  return roundPercent(((traceAValue - traceBValue) / traceBValue) * 100);
};

const flattenSpans = (spans = []) => spans.flatMap((span) => [
  {
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    service: span.service,
    operation: span.operation,
    durationMs: span.durationMs,
    status: span.status,
    kind: span.kind
  },
  ...flattenSpans(span.children || [])
]);

const createTraceSummary = (trace) => ({
  traceId: trace.traceId,
  timestamp: trace.timestamp,
  rootService: trace.rootService,
  status: trace.status,
  overallDuration: trace.overallDuration,
  spanCount: trace.spanCount
});

const createSpanMetric = (span) => ({
  spanId: span.spanId,
  durationMs: span.durationMs,
  status: span.status
});

const countErrorSpans = (spans) => spans.filter((span) => span.status === "ERROR").length;

const buildServiceMetrics = (spans) => {
  const metrics = new Map();

  spans.forEach((span) => {
    const current = metrics.get(span.service) || {
      durationMs: 0,
      spanCount: 0,
      errorSpanCount: 0
    };

    metrics.set(span.service, {
      durationMs: current.durationMs + span.durationMs,
      spanCount: current.spanCount + 1,
      errorSpanCount: current.errorSpanCount + (span.status === "ERROR" ? 1 : 0)
    });
  });

  return metrics;
};

const compareServices = (traceA, traceB, spansA, spansB) => {
  const serviceMetricsA = buildServiceMetrics(spansA);
  const serviceMetricsB = buildServiceMetrics(spansB);
  const servicesA = [...serviceMetricsA.keys()].sort();
  const servicesB = [...serviceMetricsB.keys()].sort();
  const serviceSetA = new Set(servicesA);
  const serviceSetB = new Set(servicesB);
  const sharedServices = servicesA.filter((service) => serviceSetB.has(service));

  return {
    serviceComparison: sharedServices.map((service) => {
      const traceAMetrics = serviceMetricsA.get(service);
      const traceBMetrics = serviceMetricsB.get(service);
      const durationDifferenceMs = traceAMetrics.durationMs - traceBMetrics.durationMs;

      return {
        service,
        traceA: traceAMetrics,
        traceB: traceBMetrics,
        durationDifferenceMs,
        percentageDifference: calculateDifferencePercent(traceAMetrics.durationMs, traceBMetrics.durationMs),
        slowerTraceId: durationDifferenceMs > 0 ? traceA.traceId : durationDifferenceMs < 0 ? traceB.traceId : null
      };
    }),
    uniqueServices: {
      onlyInTraceA: servicesA.filter((service) => !serviceSetB.has(service)),
      onlyInTraceB: servicesB.filter((service) => !serviceSetA.has(service))
    }
  };
};

const groupComparableSpans = (spans) => {
  const groups = new Map();

  spans.forEach((span) => {
    const key = `${span.service}\u0000${span.operation}`;
    const current = groups.get(key) || {
      service: span.service,
      operation: span.operation,
      spans: []
    };

    current.spans.push(span);
    groups.set(key, current);
  });

  groups.forEach((group) => {
    group.spans.sort((a, b) => {
      if (b.durationMs !== a.durationMs) {
        return b.durationMs - a.durationMs;
      }

      return a.spanId.localeCompare(b.spanId);
    });
  });

  return groups;
};

const compareSpanPair = (traceA, traceB, groupA, groupB, index) => {
  const spanA = groupA?.spans[index] || null;
  const spanB = groupB?.spans[index] || null;
  const service = groupA?.service || groupB.service;
  const operation = groupA?.operation || groupB.operation;
  const comparison = spanA && spanB ? "both" : spanA ? "only_in_trace_a" : "only_in_trace_b";
  const durationDifferenceMs = spanA && spanB ? spanA.durationMs - spanB.durationMs : null;

  return {
    service,
    operation,
    occurrenceIndex: index + 1,
    traceA: spanA ? createSpanMetric(spanA) : null,
    traceB: spanB ? createSpanMetric(spanB) : null,
    durationDifferenceMs,
    percentageDifference: spanA && spanB
      ? calculateDifferencePercent(spanA.durationMs, spanB.durationMs)
      : null,
    slowerTraceId: durationDifferenceMs > 0 ? traceA.traceId : durationDifferenceMs < 0 ? traceB.traceId : null,
    statusChanged: spanA && spanB ? spanA.status !== spanB.status : null,
    comparison
  };
};

const compareSpans = (traceA, traceB, spansA, spansB) => {
  const groupedA = groupComparableSpans(spansA);
  const groupedB = groupComparableSpans(spansB);
  const keys = [...new Set([...groupedA.keys(), ...groupedB.keys()])].sort((left, right) => {
    const leftGroup = groupedA.get(left) || groupedB.get(left);
    const rightGroup = groupedA.get(right) || groupedB.get(right);
    return `${leftGroup.service}:${leftGroup.operation}`.localeCompare(`${rightGroup.service}:${rightGroup.operation}`);
  });

  return keys.flatMap((key) => {
    const groupA = groupedA.get(key);
    const groupB = groupedB.get(key);
    const pairCount = Math.max(groupA?.spans.length || 0, groupB?.spans.length || 0);

    return Array.from({ length: pairCount }, (_, index) => (
      compareSpanPair(traceA, traceB, groupA, groupB, index)
    ));
  });
};

const compareTraces = (traceA, traceB) => {
  const spansA = flattenSpans(traceA.spans);
  const spansB = flattenSpans(traceB.spans);
  const durationDifferenceMs = traceA.overallDuration - traceB.overallDuration;
  const { serviceComparison, uniqueServices } = compareServices(traceA, traceB, spansA, spansB);

  return {
    traces: [
      createTraceSummary(traceA),
      createTraceSummary(traceB)
    ],
    summary: {
      slowerTraceId: durationDifferenceMs > 0 ? traceA.traceId : durationDifferenceMs < 0 ? traceB.traceId : null,
      fasterTraceId: durationDifferenceMs > 0 ? traceB.traceId : durationDifferenceMs < 0 ? traceA.traceId : null,
      durationDifferenceMs,
      durationDifferencePercent: calculateDifferencePercent(traceA.overallDuration, traceB.overallDuration),
      statusComparison: {
        traceA: traceA.status,
        traceB: traceB.status,
        different: traceA.status !== traceB.status
      },
      traceA: {
        overallDuration: traceA.overallDuration,
        spanCount: traceA.spanCount,
        errorSpanCount: countErrorSpans(spansA),
        serviceCount: new Set(spansA.map((span) => span.service)).size,
        status: traceA.status
      },
      traceB: {
        overallDuration: traceB.overallDuration,
        spanCount: traceB.spanCount,
        errorSpanCount: countErrorSpans(spansB),
        serviceCount: new Set(spansB.map((span) => span.service)).size,
        status: traceB.status
      }
    },
    serviceComparison,
    spanComparison: compareSpans(traceA, traceB, spansA, spansB),
    uniqueServices
  };
};

module.exports = {
  compareTraces
};
