const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const traceRoutes = require("./routes/trace.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/hello", (req, res) => {
  res.json({
    message: "Hello World 12s",
    status: "Backend is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", traceRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
