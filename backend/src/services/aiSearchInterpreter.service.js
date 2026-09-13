const Groq = require("groq-sdk");
const { AppError } = require("../middleware/error.middleware");

const CACHE_TTL_MS = 5 * 60 * 1000;
const GROQ_TIMEOUT_MS = 30000;
const REQUIRED_FIELDS = [
  "traceId",
  "status",
  "service",
  "operation",
  "minDurationMs",
  "maxDurationMs",
  "from",
  "to",
  "sortBy",
  "sortOrder"
];
const VALID_STATUSES = new Set(["OK", "ERROR"]);
const VALID_SORT_BY = new Set(["timestamp", "duration"]);
const VALID_SORT_ORDER = new Set(["asc", "desc"]);

const cache = new Map();
let groqClient = null;

const SYSTEM_PROMPT = `You convert natural-language distributed trace searches into structured filters.

Return ONLY valid JSON. Do not include markdown.
Do not generate trace IDs unless the user explicitly asks for a trace ID.
Do not generate trace results.
Do not invent telemetry.
Use only these fields:
{
  "traceId": string|null,
  "status": "OK"|"ERROR"|null,
  "service": string|null,
  "operation": string|null,
  "minDurationMs": number|null,
  "maxDurationMs": number|null,
  "from": ISO timestamp|null,
  "to": ISO timestamp|null,
  "sortBy": "timestamp"|"duration"|null,
  "sortOrder": "asc"|"desc"|null
}

If the query cannot be mapped to these supported filters, return:
{
  "traceId": null,
  "status": null,
  "service": null,
  "operation": null,
  "minDurationMs": null,
  "maxDurationMs": null,
  "from": null,
  "to": null,
  "sortBy": null,
  "sortOrder": null
}`;

const normalizeQuery = (query) => query.trim().replace(/\s+/g, " ").toLowerCase();

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_TOKEN;

  if (!apiKey) {
    throw new AppError("GROQ_API_TOKEN is missing or empty", 500);
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
};

const getGroqModel = () => {
  const model = process.env.GROQ_MODEL;

  if (!model) {
    throw new AppError("GROQ_MODEL is missing or empty", 500);
  }

  return model;
};

const withTimeout = (promise) => {
  let timeoutId;

  const timeout = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AppError("AI search failed: Groq request timed out", 502));
    }, GROQ_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const parseModelJson = (content) => {
  if (!content || typeof content !== "string") {
    throw new AppError("AI search failed: empty response from Groq", 502);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new AppError("AI search failed: malformed JSON response from Groq", 502);
  }
};

const validateStringOrNull = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || !value.trim() || value.includes("$")) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  return value.trim();
};

const validateNumberOrNull = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  return value;
};

const validateIsoTimestampOrNull = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  return value;
};

const validateFilters = (filters) => {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new AppError("AI search failed: invalid filter response from Groq", 502);
  }

  Object.keys(filters).forEach((field) => {
    if (!REQUIRED_FIELDS.includes(field) || field.includes("$") || field.includes(".")) {
      throw new AppError("The search query could not be mapped to supported trace filters.", 400);
    }
  });

  REQUIRED_FIELDS.forEach((field) => {
    if (!(field in filters)) {
      throw new AppError("AI search failed: missing filter field from Groq response", 502);
    }
  });

  const parsed = {
    traceId: validateStringOrNull(filters.traceId, "traceId"),
    status: validateStringOrNull(filters.status, "status"),
    service: validateStringOrNull(filters.service, "service"),
    operation: validateStringOrNull(filters.operation, "operation"),
    minDurationMs: validateNumberOrNull(filters.minDurationMs),
    maxDurationMs: validateNumberOrNull(filters.maxDurationMs),
    from: validateIsoTimestampOrNull(filters.from),
    to: validateIsoTimestampOrNull(filters.to),
    sortBy: validateStringOrNull(filters.sortBy, "sortBy"),
    sortOrder: validateStringOrNull(filters.sortOrder, "sortOrder")
  };

  if (parsed.status && !VALID_STATUSES.has(parsed.status)) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  if (parsed.sortBy && !VALID_SORT_BY.has(parsed.sortBy)) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  if (parsed.sortOrder && !VALID_SORT_ORDER.has(parsed.sortOrder)) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  if (
    parsed.minDurationMs !== null &&
    parsed.maxDurationMs !== null &&
    parsed.minDurationMs > parsed.maxDurationMs
  ) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  const hasSearchFilter = [
    "traceId",
    "status",
    "service",
    "operation",
    "minDurationMs",
    "maxDurationMs",
    "from",
    "to"
  ].some((field) => parsed[field] !== null);

  if (!hasSearchFilter) {
    throw new AppError("The search query could not be mapped to supported trace filters.", 400);
  }

  return parsed;
};

const getCachedFilters = (cacheKey) => {
  const cached = cache.get(cacheKey);

  if (!cached || Date.now() >= cached.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }

  return cached.filters;
};

const interpretQuery = async (query) => {
  const cacheKey = normalizeQuery(query);
  const cachedFilters = getCachedFilters(cacheKey);

  if (cachedFilters) {
    return cachedFilters;
  }

  let completion;

  try {
    completion = await withTimeout(
      getGroqClient().chat.completions.create({
        model: getGroqModel(),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Search query: ${query}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("AI search failed: Groq request failed", 502);
  }

  const content = completion.choices?.[0]?.message?.content;
  const filters = validateFilters(parseModelJson(content));

  cache.set(cacheKey, {
    filters,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return filters;
};

module.exports = {
  interpretQuery
};
