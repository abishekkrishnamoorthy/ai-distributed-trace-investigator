const Groq = require("groq-sdk");
const { AppError } = require("../middleware/error.middleware");

const REQUIRED_ANALYSIS_FIELDS = [
  "summary",
  "observedFacts",
  "interpretation",
  "bottleneck",
  "recommendations"
];

const GROQ_TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `You are an AI assistant for distributed trace investigation.

Analyze ONLY the telemetry and deterministic analysis provided in the TRACE CONTEXT.

Your responsibilities are:

1. Summarize what happened in the trace.
2. Identify important observations.
3. Interpret the deterministic analysis provided by the application.
4. Select one primary bottleneck candidate from the supplied bottleneckCandidates.
5. Explain why that candidate may be significant.
6. Suggest reasonable next investigation steps.

STRICT RULES:

- Use only information provided in TRACE CONTEXT.
- Never invent telemetry.
- Never invent spans, services, durations, statuses, timestamps, logs, metrics, infrastructure conditions, database behavior, HTTP response codes, CPU usage, memory usage, network failures, timeout events, or external-service behavior.
- Treat application-generated deterministic metrics as authoritative.
- Do not recalculate or override deterministic application results.
- Do not calculate a different bottleneck ranking.
- Select the primary bottleneck only from bottleneckCandidates.
- Return exactly one bottleneck object, or null if no bottleneck candidate exists.
- Do not claim a root cause unless the supplied telemetry directly supports it.
- A bottleneck candidate is NOT a confirmed root cause.
- Do not treat candidateScore as probability or causal certainty.
- Do not automatically identify the root span as the bottleneck simply because it has the longest duration.
- Parent-child relationships describe trace structure only.
- Parent-child relationships do NOT prove causality.
- Never claim that a parent span caused a child span's error, latency, or failure solely because of hierarchy.
- Do not claim that one service caused another service to fail unless the telemetry explicitly supports that conclusion.
- If a span has kind "client", describe it only as a client operation/call unless additional information is explicitly provided.
- Do not assume that a client call means a network failure, timeout, external-service failure, or HTTP error.
- Do not invent HTTP response codes.
- Do not invent database behavior.
- Do not invent CPU, memory, network, infrastructure, or log information.
- Do not invent exact span start times, end times, overlap, or critical-path timing.
- Clearly distinguish observed facts from AI interpretation.
- Clearly distinguish recommendations from observed facts.
- Every major finding must reference relevant span evidence.
- Evidence must reference actual span IDs present in TRACE CONTEXT.
- If the telemetry is insufficient to determine a root cause, explicitly state that the available telemetry is insufficient.
- A recommendation may suggest checking telemetry that is not currently available, but it must be presented as a recommendation rather than an observed fact.
- Return ONLY valid JSON matching the requested schema.`;

let groqClient = null;

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

const flattenHierarchy = (nodes) => {
  const flattened = [];

  const visit = (node) => {
    flattened.push({
      spanId: node.spanId,
      parentSpanId: node.parentSpanId,
      service: node.service,
      operation: node.operation,
      durationMs: node.durationMs,
      status: node.status,
      kind: node.kind
    });

    (node.children || []).forEach(visit);
  };

  nodes.forEach(visit);
  return flattened;
};

const sanitizeHierarchy = (nodes) => {
  return nodes.map((node) => ({
    spanId: node.spanId,
    parentSpanId: node.parentSpanId,
    service: node.service,
    operation: node.operation,
    durationMs: node.durationMs,
    status: node.status,
    kind: node.kind,
    children: sanitizeHierarchy(node.children || [])
  }));
};

const buildTraceContext = (trace) => ({
  trace: {
    traceId: trace.traceId,
    timestamp: trace.timestamp,
    rootService: trace.rootService,
    status: trace.status,
    overallDuration: trace.overallDuration,
    spanCount: trace.spanCount,
    services: trace.services
  },
  deterministicMetrics: trace.metrics,
  spans: flattenHierarchy(trace.spans),
  hierarchy: sanitizeHierarchy(trace.spans),
  bottleneckCandidates: trace.bottleneckCandidates,
  primaryBottleneck: trace.bottleneck
});

const buildUserPrompt = (traceContext) => `TRACE CONTEXT
${JSON.stringify(traceContext, null, 2)}

Return JSON with this exact shape:
{
  "summary": "string",
  "observedFacts": [
    {
      "statement": "string",
      "evidence": ["spanId"]
    }
  ],
  "interpretation": [
    {
      "statement": "string",
      "evidence": ["spanId"]
    }
  ],
  "bottleneck": {
    "spanId": "string",
    "service": "string",
    "operation": "string",
    "durationMs": 0,
    "reason": "string",
    "evidence": ["spanId"]
  },
  "recommendations": [
    {
      "statement": "string",
      "reason": "string",
      "evidence": ["spanId"]
    }
  ]
}

If there are no bottleneck candidates, return "bottleneck": null.`;

const parseModelJson = (content) => {
  if (!content || typeof content !== "string") {
    throw new AppError("AI analysis failed: empty response from Groq", 502);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new AppError("AI analysis failed: malformed JSON response from Groq", 502);
  }
};

const collectSpanIds = (nodes) => {
  const spanIds = new Set();

  const visit = (node) => {
    if (node?.spanId) {
      spanIds.add(node.spanId);
    }

    (node.children || []).forEach(visit);
  };

  nodes.forEach(visit);
  return spanIds;
};

const validateEvidence = (evidence, validSpanIds, fieldPath) => {
  if (!Array.isArray(evidence)) {
    throw new AppError(`AI analysis failed: ${fieldPath}.evidence must be an array`, 502);
  }

  evidence.forEach((spanId) => {
    if (typeof spanId !== "string") {
      throw new AppError(`AI analysis failed: ${fieldPath}.evidence must contain only strings`, 502);
    }

    if (!validSpanIds.has(spanId)) {
      throw new AppError(`AI analysis failed: invalid evidence spanId ${spanId}`, 502);
    }
  });
};

const validateStatementWithEvidence = (item, validSpanIds, fieldPath) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new AppError(`AI analysis failed: ${fieldPath} item must be an object`, 502);
  }

  if (typeof item.statement !== "string") {
    throw new AppError(`AI analysis failed: ${fieldPath}.statement must be a string`, 502);
  }

  validateEvidence(item.evidence, validSpanIds, fieldPath);
};

const validateBottleneck = (bottleneck, trace, validSpanIds) => {
  const bottleneckCandidateById = new Map(
    trace.bottleneckCandidates.map((candidate) => [candidate.spanId, candidate])
  );

  if (bottleneck === null) {
    if (bottleneckCandidateById.size > 0) {
      throw new AppError("AI analysis failed: bottleneck must select a supplied candidate", 502);
    }

    return;
  }

  if (!bottleneck || typeof bottleneck !== "object" || Array.isArray(bottleneck)) {
    throw new AppError("AI analysis failed: bottleneck must be an object or null", 502);
  }

  ["spanId", "service", "operation", "reason"].forEach((field) => {
    if (typeof bottleneck[field] !== "string") {
      throw new AppError(`AI analysis failed: bottleneck.${field} must be a string`, 502);
    }
  });

  if (typeof bottleneck.durationMs !== "number") {
    throw new AppError("AI analysis failed: bottleneck.durationMs must be a number", 502);
  }

  validateEvidence(bottleneck.evidence, validSpanIds, "bottleneck");

  if (!validSpanIds.has(bottleneck.spanId)) {
    throw new AppError(`AI analysis failed: invalid bottleneck spanId ${bottleneck.spanId}`, 502);
  }

  const candidate = bottleneckCandidateById.get(bottleneck.spanId);

  if (!candidate) {
    throw new AppError(
      `AI analysis failed: bottleneck spanId ${bottleneck.spanId} was not supplied as a bottleneck candidate`,
      502
    );
  }

  ["service", "operation", "durationMs"].forEach((field) => {
    if (bottleneck[field] !== candidate[field]) {
      throw new AppError(`AI analysis failed: bottleneck.${field} does not match supplied telemetry`, 502);
    }
  });
};

const validateAnalysis = (analysis, trace) => {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
    throw new AppError("AI analysis failed: invalid response shape from Groq", 502);
  }

  REQUIRED_ANALYSIS_FIELDS.forEach((field) => {
    if (!(field in analysis)) {
      throw new AppError(`AI analysis failed: missing ${field} in Groq response`, 502);
    }
  });

  if (typeof analysis.summary !== "string") {
    throw new AppError("AI analysis failed: summary must be a string", 502);
  }

  [
    "observedFacts",
    "interpretation",
    "recommendations"
  ].forEach((field) => {
    if (!Array.isArray(analysis[field])) {
      throw new AppError(`AI analysis failed: ${field} must be an array`, 502);
    }
  });

  const validSpanIds = collectSpanIds(trace.spans);

  analysis.observedFacts.forEach((item, index) => {
    validateStatementWithEvidence(item, validSpanIds, `observedFacts[${index}]`);
  });

  analysis.interpretation.forEach((item, index) => {
    validateStatementWithEvidence(item, validSpanIds, `interpretation[${index}]`);
  });

  validateBottleneck(analysis.bottleneck, trace, validSpanIds);

  if (analysis.recommendations.length > 5) {
    throw new AppError("AI analysis failed: recommendations cannot exceed 5 items", 502);
  }

  analysis.recommendations.forEach((item, index) => {
    const fieldPath = `recommendations[${index}]`;
    validateStatementWithEvidence(item, validSpanIds, fieldPath);

    if (typeof item.reason !== "string") {
      throw new AppError(`AI analysis failed: ${fieldPath}.reason must be a string`, 502);
    }
  });

  return {
    summary: analysis.summary,
    observedFacts: analysis.observedFacts,
    interpretation: analysis.interpretation,
    bottleneck: analysis.bottleneck,
    recommendations: analysis.recommendations
  };
};

const withTimeout = (promise) => {
  let timeoutId;

  const timeout = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AppError("AI analysis failed: Groq request timed out", 502));
    }, GROQ_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const analyzeTrace = async (trace) => {
  const client = getGroqClient();
  const model = getGroqModel();
  const traceContext = buildTraceContext(trace);

  let completion;

  try {
    completion = await withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(traceContext)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("AI analysis failed: Groq API request failed", 502);
  }

  const content = completion?.choices?.[0]?.message?.content;
  return validateAnalysis(parseModelJson(content), trace);
};

module.exports = {
  analyzeTrace
};
