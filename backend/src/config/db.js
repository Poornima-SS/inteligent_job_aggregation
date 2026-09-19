const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("MONGO_URI not set — skipping database connection");
    return { connected: false };
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected → ${mongoose.connection.name}`);
    return { connected: true, name: mongoose.connection.name };
  } catch (err) {
    console.warn("MongoDB not connected:", err.message);
    console.warn("API will still run; start MongoDB or set Atlas URI in .env");
    return { connected: false, error: err.message };
  }
}

function isDBConnected() {
  // 1 = connected
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDBConnected };
