const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    const error = new Error("MONGODB_URI is required");
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "AI-TRACE-INVESTIGATION"
    });
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
