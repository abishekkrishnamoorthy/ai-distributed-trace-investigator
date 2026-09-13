const express = require("express");
const traceController = require("../controllers/trace.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/health", traceController.getHealth);
router.use(authenticate);
router.get("/traces", traceController.getTraces);
router.get("/traces/stats", traceController.getTraceStats);
router.post("/traces/analyze", traceController.analyzeTraces);
router.post("/traces/ai-search", traceController.aiSearch);
router.post("/traces/compare", traceController.compareTraces);
router.get("/traces/:traceId", traceController.getTraceById);
router.get("/services", traceController.getServices);

module.exports = router;
