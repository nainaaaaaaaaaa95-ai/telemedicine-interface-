
const express = require("express");
const cors = require("cors");

const patientRoutes = require("./routes/patientroutes");
const appointmentRoutes = require("./routes/appointmentroutes");
const doctorRoutes = require("./routes/doctorroutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const authRoutes = require("./routes/authroutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

app.use("/api/patients", patientRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

module.exports = app;

