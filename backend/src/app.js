const express = require("express");

const app = express();

app.use(express.json());

app.get("/hello", (req, res) => {
  res.json({
    message: "Hello World 12",
    status: "Backend is running"
  });
});

module.exports = app;
