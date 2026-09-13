const mongoose = require("mongoose");
const traceService = require("../services/trace.service");
const aiSearchService = require("../services/aiSearch.service");
const aiTraceAnalysisService = require("../services/aiTraceAnalysis.service");
const traceCompareService = require("../services/traceCompare.service");
const { AppError } = require("../middleware/error.middleware");

const getHealth = (req, res) => {
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "ok",
    database
  });
};

const getTraces = async (req, res, next) => {
  try {
    const result = await traceService.getTraces(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getTraceStats = async (req, res, next) => {
  try {
    const stats = await traceService.getTraceStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getTraceById = async (req, res, next) => {
  try {
    const trace = await traceService.getTraceById(req.params.traceId);
    res.json(trace);
  } catch (error) {
    next(error);
  }
};

const validateTraceIds = (traceIds) => {
  if (!Array.isArray(traceIds) || traceIds.length === 0) {
    throw new AppError("traceIds must be a non-empty array", 400);
  }

  return traceIds.map((traceId) => {
    if (typeof traceId !== "string" || !traceId.trim()) {
      throw new AppError("traceIds must contain only non-empty strings", 400);
    }

    return traceId.trim();
  });
};

const validateCompareTraceIds = (traceIds) => {
  if (!Array.isArray(traceIds)) {
    throw new AppError("Exactly 2 trace IDs are required for comparison.", 400);
  }

  if (traceIds.length !== 2) {
    throw new AppError("Exactly 2 trace IDs are required for comparison.", 400);
  }

  const normalizedTraceIds = traceIds.map((traceId) => {
    if (typeof traceId !== "string" || !traceId.trim()) {
      throw new AppError("traceIds must contain only non-empty strings", 400);
    }

    return traceId.trim();
  });

  if (normalizedTraceIds[0] === normalizedTraceIds[1]) {
    throw new AppError("Two different trace IDs are required.", 400);
  }

  return normalizedTraceIds;
};

const analyzeTraces = async (req, res, next) => {
  try {
    const traceIds = validateTraceIds(req.body?.traceIds);

    const data = await Promise.all(
      traceIds.map(async (traceId) => {
        const traceResult = await traceService.getTraceById(traceId);
        const analysis = await aiTraceAnalysisService.analyzeTrace(traceResult.data);

        return {
          traceId,
          analysis
        };
      })
    );

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const aiSearch = async (req, res, next) => {
  try {
    const result = await aiSearchService.aiSearch(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const compareTraces = async (req, res, next) => {
  try {
    const traceIds = validateCompareTraceIds(req.body?.traceIds);
    const result = await traceCompareService.compareTraces(traceIds);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getServices = async (req, res, next) => {
  try {
    const services = await traceService.getServices();
    res.json(services);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getTraces,
  getTraceStats,
  getTraceById,
  analyzeTraces,
  aiSearch,
  compareTraces,
  getServices
};
