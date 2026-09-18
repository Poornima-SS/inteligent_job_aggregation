const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("MONGO_URI not set — skipping database connection");
    return { connected: false };
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    return { connected: true };
  } catch (err) {
    console.warn("MongoDB not connected:", err.message);
    console.warn("API will still run; start MongoDB or set Atlas URI in .env for later phases");
    return { connected: false, error: err.message };
  }
}

module.exports = { connectDB };
