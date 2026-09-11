require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

server.on("error", (error) => {
  console.error("Failed to start backend server:", error);
  process.exit(1);
});
