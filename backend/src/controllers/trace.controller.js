const mongoose = require("mongoose");
const traceService = require("../services/trace.service");
const aiTraceAnalysisService = require("../services/aiTraceAnalysis.service");
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
  getTraceById,
  analyzeTraces,
  getServices
};
