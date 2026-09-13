const traceService = require("./trace.service");
const { AppError } = require("../middleware/error.middleware");
const traceComparison = require("../utils/traceComparison");

const getComparableTrace = async (traceId) => {
  try {
    const result = await traceService.getTraceById(traceId);
    return result.data;
  } catch (error) {
    if (error.statusCode === 404) {
      throw new AppError("One or more requested traces were not found.", 404);
    }

    throw error;
  }
};

const compareTraces = async (traceIds) => {
  const [traceA, traceB] = await Promise.all(traceIds.map(getComparableTrace));

  return {
    data: traceComparison.compareTraces(traceA, traceB)
  };
};

module.exports = {
  compareTraces
};
