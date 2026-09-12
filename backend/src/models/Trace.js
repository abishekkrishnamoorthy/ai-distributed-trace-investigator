const mongoose = require("mongoose");

const spanSchema = new mongoose.Schema(
  {
    spanId: {
      type: String,
      required: true
    },
    parentSpanId: {
      type: String,
      default: null
    },
    service: {
      type: String,
      required: true
    },
    operation: {
      type: String,
      required: true
    },
    durationMs: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    kind: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const traceSchema = new mongoose.Schema(
  {
    traceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    rootService: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      index: true
    },
    spans: {
      type: [spanSchema],
      default: []
    }
  },
  {
    collection: "trace",
    versionKey: false
  }
);

traceSchema.index({ "spans.service": 1 });

module.exports = mongoose.model("Trace", traceSchema);
