const express = require("express");
const traceController = require("../controllers/trace.controller");

const router = express.Router();

router.get("/health", traceController.getHealth);
router.get("/traces", traceController.getTraces);
router.post("/traces/analyze", traceController.analyzeTraces);
router.get("/traces/:traceId", traceController.getTraceById);
router.get("/services", traceController.getServices);

module.exports = router;
