const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {},
  {
    collection: "service",
    strict: false,
    versionKey: false
  }
);

module.exports = mongoose.model("Service", serviceSchema);
