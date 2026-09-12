require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("Failed to start backend servers:", error);
      process.exit(1);
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
