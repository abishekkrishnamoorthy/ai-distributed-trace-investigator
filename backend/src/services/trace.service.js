const mongoose = require("mongoose");
const Trace = require("../models/Trace");
const Service = require("../models/Service");
const { AppError } = require("../middleware/error.middleware");

const VALID_STATUSES = new Set(["OK", "ERROR"]);
const VALID_SORT_BY = new Set(["timestamp", "duration"]);
const VALID_ORDER = new Set(["asc", "desc"]);
const QUERY_FIELDS = new Set([
  "page",
  "limit",
  "traceId",
  "service",
  "status",
  "minDuration",
  "maxDuration",
  "sortBy",
  "order"
]);

const parsePositiveInteger = (value, fieldName, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(value) || !/^\d+$/.test(String(value))) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  const parsed = Number(value);
  if (parsed < 1) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  return parsed;
};

const parseNonNegativeNumber = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || value === "" || Number.isNaN(Number(value))) {
    throw new AppError(`${fieldName} must be a non-negative number`, 400);
  }

  const parsed = Number(value);
  if (parsed < 0) {
    throw new AppError(`${fieldName} must be a non-negative number`, 400);
  }

  return parsed;
};

const parseString = (value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || typeof value === "object") {
    throw new AppError(`${fieldName} must be a string`, 400);
  }

  const parsed = String(value).trim();
  if (!parsed) {
    throw new AppError(`${fieldName} cannot be empty`, 400);
  }

  if (parsed.includes("$")) {
    throw new AppError(`${fieldName} contains invalid characters`, 400);
  }

  return parsed;
};

const validateListQuery = (query) => {
  Object.keys(query).forEach((key) => {
    if (!QUERY_FIELDS.has(key) || key.includes("$") || key.includes(".")) {
      throw new AppError(`Invalid query parameter: ${key}`, 400);
    }
  });

  const page = parsePositiveInteger(query.page, "page", 1);
  const limit = parsePositiveInteger(query.limit, "limit", 10);
  const traceId = parseString(query.traceId, "traceId");
  const service = parseString(query.service, "service");
  const status = parseString(query.status, "status");
  const minDuration = parseNonNegativeNumber(query.minDuration, "minDuration");
  const maxDuration = parseNonNegativeNumber(query.maxDuration, "maxDuration");
  const sortBy = parseString(query.sortBy, "sortBy") || "timestamp";
  const order = parseString(query.order, "order") || "desc";

  if (limit > 100) {
    throw new AppError("limit cannot be greater than 100", 400);
  }

  if (status && !VALID_STATUSES.has(status)) {
    throw new AppError("status must be OK or ERROR", 400);
  }

  if (!VALID_SORT_BY.has(sortBy)) {
    throw new AppError("sortBy must be timestamp or duration", 400);
  }

  if (!VALID_ORDER.has(order)) {
    throw new AppError("order must be asc or desc", 400);
  }

  if (
    minDuration !== undefined &&
    maxDuration !== undefined &&
    minDuration > maxDuration
  ) {
    throw new AppError("minDuration cannot be greater than maxDuration", 400);
  }

  return {
    page,
    limit,
    traceId,
    service,
    status,
    minDuration,
    maxDuration,
    sortBy,
    order
  };
};

const rootDurationStages = [
  {
    $addFields: {
      rootSpan: {
        $first: {
          $filter: {
            input: "$spans",
            as: "span",
            cond: { $eq: ["$$span.parentSpanId", null] }
          }
        }
      }
    }
  },
  {
    $addFields: {
      overallDuration: "$rootSpan.durationMs",
      spanCount: { $size: "$spans" }
    }
  }
];

const buildMatch = ({ traceId, service, status }) => {
  const match = {};

  if (traceId) {
    match.traceId = traceId;
  }

  if (service) {
    match["spans.service"] = service;
  }

  if (status) {
    match.status = status;
  }

  return match;
};

const getTraces = async (query) => {
  const filters = validateListQuery(query);
  const match = buildMatch(filters);
  const durationMatch = {};

  if (filters.minDuration !== undefined) {
    durationMatch.$gte = filters.minDuration;
  }

  if (filters.maxDuration !== undefined) {
    durationMatch.$lte = filters.maxDuration;
  }

  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push(...rootDurationStages);

  if (Object.keys(durationMatch).length > 0) {
    pipeline.push({ $match: { overallDuration: durationMatch } });
  }

  const sortField = filters.sortBy === "duration" ? "overallDuration" : "timestamp";
  const sortDirection = filters.order === "asc" ? 1 : -1;
  const skip = (filters.page - 1) * filters.limit;

  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortField]: sortDirection, traceId: 1 } },
        { $skip: skip },
        { $limit: filters.limit },
        {
          $project: {
            _id: 0,
            traceId: 1,
            timestamp: 1,
            rootService: 1,
            status: 1,
            overallDuration: 1,
            spanCount: 1
          }
        }
      ],
      totalCount: [{ $count: "total" }]
    }
  });

  const [result] = await Trace.aggregate(pipeline);
  const total = result.totalCount[0]?.total || 0;

  return {
    data: result.data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit)
    }
  };
};

const getTraceStats = async () => {
  const [result] = await Trace.aggregate([
    ...rootDurationStages,
    {
      $group: {
        _id: null,
        totalTraces: { $sum: 1 },
        successfulTraces: {
          $sum: {
            $cond: [{ $eq: ["$status", "OK"] }, 1, 0]
          }
        },
        errorTraces: {
          $sum: {
            $cond: [{ $eq: ["$status", "ERROR"] }, 1, 0]
          }
        },
        averageDuration: { $avg: "$overallDuration" }
      }
    },
    {
      $project: {
        _id: 0,
        totalTraces: 1,
        successfulTraces: 1,
        errorTraces: 1,
        averageDuration: { $round: ["$averageDuration", 0] },
        successRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$successfulTraces", "$totalTraces"] },
                100
              ]
            },
            0
          ]
        },
        errorRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$errorTraces", "$totalTraces"] },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ]);

  return {
    data: result || {
      totalTraces: 0,
      successfulTraces: 0,
      errorTraces: 0,
      averageDuration: 0,
      successRate: 0,
      errorRate: 0
    }
  };
};

const createSpanSummary = (span) => ({
  spanId: span.spanId,
  service: span.service,
  operation: span.operation,
  durationMs: span.durationMs
});

const findRootSpan = (spans) => {
  const rootSpans = spans.filter((span) => span.parentSpanId === null);

  if (rootSpans.length === 0) {
    throw new AppError("Trace data integrity error: root span is missing", 500);
  }

  if (rootSpans.length > 1) {
    throw new AppError("Trace data integrity error: multiple root spans found", 500);
  }

  return rootSpans[0];
};

const calculateMetrics = (spans) => {
  const longestSpan = spans.reduce((currentLongest, span) => {
    return span.durationMs > currentLongest.durationMs ? span : currentLongest;
  }, spans[0]);
  const errorSpans = spans.filter((span) => span.status === "ERROR");

  return {
    longestSpan: createSpanSummary(longestSpan),
    errorSpanCount: errorSpans.length,
    errorSpans: errorSpans.map(createSpanSummary)
  };
};

const buildChildrenMap = (spans) => {
  const spanIds = new Set();
  const childrenMap = new Map();

  spans.forEach((span) => {
    if (spanIds.has(span.spanId)) {
      throw new AppError("Trace data integrity error: duplicate spanId found", 500);
    }

    spanIds.add(span.spanId);
    childrenMap.set(span.spanId, []);
  });

  childrenMap.set(null, []);

  spans.forEach((span) => {
    if (span.parentSpanId !== null && !spanIds.has(span.parentSpanId)) {
      throw new AppError(
        "Trace data integrity error: span references a missing parent",
        500
      );
    }

    const siblings = childrenMap.get(span.parentSpanId) || [];
    siblings.push(span);
    childrenMap.set(span.parentSpanId, siblings);
  });

  return childrenMap;
};

const buildHierarchy = (span, childrenMap, visited = new Set()) => {
  if (visited.has(span.spanId)) {
    throw new AppError("Trace data integrity error: span hierarchy cycle found", 500);
  }

  const nextVisited = new Set(visited);
  nextVisited.add(span.spanId);
  const children = childrenMap.get(span.spanId) || [];

  return {
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    service: span.service,
    operation: span.operation,
    durationMs: span.durationMs,
    status: span.status,
    kind: span.kind,
    children: children.map((child) => buildHierarchy(child, childrenMap, nextVisited))
  };
};

const findBottleneckCandidates = (spans, rootSpan) => {
  const nonRootSpans = spans.filter((span) => span.spanId !== rootSpan.spanId);

  if (nonRootSpans.length === 0) {
    return [];
  }

  const maxNonRootDuration = Math.max(
    ...nonRootSpans.map((span) => span.durationMs)
  );
  const highDurationThreshold = maxNonRootDuration * 0.5;

  return nonRootSpans
    .map((span) => {
      const signals = [];
      const durationScore =
        maxNonRootDuration > 0 ? (span.durationMs / maxNonRootDuration) * 70 : 0;
      const isHighDuration = span.durationMs >= highDurationThreshold;
      const isError = span.status === "ERROR";
      const isClient = span.kind === "client";

      if (isHighDuration) {
        signals.push("high_duration");
      }

      if (isError) {
        signals.push("error");
      }

      if (isClient) {
        signals.push("client");
      }

      // Application-generated heuristic ranking used to prioritize spans for investigation.
      const candidateScore = Math.min(
        100,
        Math.round(durationScore + (isError ? 20 : 0))
      );

      return {
        spanId: span.spanId,
        service: span.service,
        operation: span.operation,
        durationMs: span.durationMs,
        status: span.status,
        parentSpanId: span.parentSpanId,
        signals,
        candidateScore
      };
    })
    .filter((candidate) => {
      return (
        candidate.signals.includes("high_duration") ||
        candidate.signals.includes("error")
      );
    })
    .sort((a, b) => {
      if (b.candidateScore !== a.candidateScore) {
        return b.candidateScore - a.candidateScore;
      }

      return b.durationMs - a.durationMs;
    });
};

const createPrimaryBottleneck = (candidate) => {
  if (!candidate) {
    return null;
  }

  return {
    spanId: candidate.spanId,
    service: candidate.service,
    operation: candidate.operation,
    durationMs: candidate.durationMs,
    status: candidate.status,
    score: candidate.candidateScore
  };
};

const getTraceById = async (traceId) => {
  const safeTraceId = parseString(traceId, "traceId");
  const trace = await Trace.findOne({ traceId: safeTraceId }).lean();

  if (!trace) {
    throw new AppError("Trace not found", 404);
  }

  if (!Array.isArray(trace.spans) || trace.spans.length === 0) {
    throw new AppError("Trace data integrity error: spans are missing", 500);
  }

  const rootSpan = findRootSpan(trace.spans);
  const childrenMap = buildChildrenMap(trace.spans);
  const services = [...new Set(trace.spans.map((span) => span.service))].sort();
  const bottleneckCandidates = findBottleneckCandidates(trace.spans, rootSpan);

  return {
    data: {
      traceId: trace.traceId,
      timestamp: trace.timestamp,
      rootService: trace.rootService,
      status: trace.status,
      overallDuration: rootSpan.durationMs,
      spanCount: trace.spans.length,
      services,
      metrics: calculateMetrics(trace.spans),
      bottleneck: createPrimaryBottleneck(bottleneckCandidates[0]),
      bottleneckCandidates,
      spans: [buildHierarchy(rootSpan, childrenMap)]
    }
  };
};

const getServices = async () => {
  const collectionExists = await mongoose.connection.db
    .listCollections({ name: "service" })
    .hasNext();

  if (collectionExists) {
    const services = await Service.find({}, { _id: 0 }).lean();
    if (services.length > 0) {
      return { data: services };
    }
  }

  const services = await Trace.distinct("spans.service");
  return {
    data: services.sort().map((name) => ({ name }))
  };
};

module.exports = {
  getTraces,
  getTraceStats,
  getTraceById,
  getServices
};
