const Trace = require("../models/Trace");
const { AppError } = require("../middleware/error.middleware");
const aiSearchInterpreter = require("./aiSearchInterpreter.service");

const MAX_LIMIT = 50;

const parsePositiveInteger = (value, fieldName) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  return value;
};

const cleanFiltersForResponse = (filters) => {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== null)
  );
};

const buildBaseMatch = (filters) => {
  const match = {};

  if (filters.traceId) {
    match.traceId = filters.traceId;
  }

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.service) {
    match["spans.service"] = filters.service;
  }

  if (filters.operation) {
    match["spans.operation"] = filters.operation;
  }

  if (filters.from || filters.to) {
    match.timestamp = {};

    if (filters.from) {
      match.timestamp.$gte = new Date(filters.from);
    }

    if (filters.to) {
      match.timestamp.$lte = new Date(filters.to);
    }
  }

  return match;
};

const buildDurationMatch = (filters) => {
  const durationMatch = {};

  if (filters.minDurationMs !== null) {
    durationMatch.$gte = filters.minDurationMs;
  }

  if (filters.maxDurationMs !== null) {
    durationMatch.$lte = filters.maxDurationMs;
  }

  return durationMatch;
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

const searchWithFilters = async ({ query, filters, page, limit }) => {
  const match = buildBaseMatch(filters);
  const durationMatch = buildDurationMatch(filters);
  const pipeline = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push(...rootDurationStages);

  if (Object.keys(durationMatch).length > 0) {
    pipeline.push({ $match: { overallDuration: durationMatch } });
  }

  const sortField = filters.sortBy === "duration" ? "overallDuration" : "timestamp";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortField]: sortDirection, traceId: 1 } },
        { $skip: skip },
        { $limit: limit },
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
    data: {
      query,
      filters: cleanFiltersForResponse(filters),
      results: result.data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  };
};

const aiSearch = async (body) => {
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    throw new AppError("query must be a non-empty string", 400);
  }

  const page = parsePositiveInteger(body?.page, "page");
  const limit = parsePositiveInteger(body?.limit, "limit");

  if (limit > MAX_LIMIT) {
    throw new AppError(`limit cannot be greater than ${MAX_LIMIT}`, 400);
  }

  const filters = await aiSearchInterpreter.interpretQuery(query);

  return searchWithFilters({ query, filters, page, limit });
};

module.exports = {
  aiSearch
};
