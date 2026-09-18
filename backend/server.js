require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
  })
);
app.use(express.json());

let dbStatus = { connected: false };

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "intelligent-job-aggregation",
    dbConnected: dbStatus.connected,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/message", (req, res) => {
  res.json({
    message: "Hello from Intelligent Job Aggregation API",
    status: "connected",
    dbConnected: dbStatus.connected,
  });
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Alice", role: "Developer" },
    { id: 2, name: "Bob", role: "Designer" },
    { id: 3, name: "Charlie", role: "Manager" },
  ]);
});

async function start() {
  dbStatus = await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`CORS allowed origin: ${CLIENT_URL}`);
  });
}

start();
