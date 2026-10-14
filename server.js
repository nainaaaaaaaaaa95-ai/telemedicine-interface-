require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Initialize Express App
const app = express();

// ✅ Middleware (once only)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration (minimal - same origin now)
app.use(cors({
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Serve Frontend Static Files
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// ✅ Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ✅ Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mega_project");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();

// ✅ Health Check
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Server is running 🚀",
    timestamp: new Date().toISOString()
  });
});

// ✅ Test endpoint
app.get("/api/test", (req, res) => {
  res.status(200).json({ 
    message: "API is working",
    time: new Date().toISOString()
  });
});

// ✅ Import Routes
const authRoutes = require("./routes/authroutes");
const appointmentRoutes = require("./routes/appointmentroutes");
const patientRoutes = require("./routes/patientroutes");
const doctorRoutes = require("./routes/doctorroutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

// ✅ Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

// ✅ SPA Routing - Serve index.html for any non-API, non-static routes
app.get("*", (req, res) => {
  // Check if it's a file request (has extension)
  if (req.path.includes(".")) {
    res.status(404).send("File not found");
    return;
  }
  // For routes without extension, serve index.html
  res.sendFile(path.join(frontendPath, "html", "index.html"));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔴 Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ Handle unhandled errors
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


