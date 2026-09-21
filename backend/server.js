require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, isDBConnected } = require("./src/config/db");
const jobsRoutes = require("./src/routes/jobs");
const authRoutes = require("./src/routes/auth");
const usersRoutes = require("./src/routes/users");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is missing in .env — auth tokens will fail");
}

app.use(
  cors({
    origin: CLIENT_URL,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "intelligent-job-aggregation",
    phase: 3,
    dbConnected: isDBConnected(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/message", (req, res) => {
  res.json({
    message: "Hello from Intelligent Job Aggregation API",
    status: "connected",
    dbConnected: isDBConnected(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/jobs", jobsRoutes);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`CORS allowed origin: ${CLIENT_URL}`);
    console.log(`MongoDB: ${isDBConnected() ? "connected" : "not connected"}`);
  });
}

start();
