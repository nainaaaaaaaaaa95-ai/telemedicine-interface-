const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

/**
 * GET all doctors (for patient appointments page)
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("_id name email");
    
    const plainDoctors = doctors.map(doc => ({
      _id: String(doc._id),
      id: String(doc._id),
      name: doc.name || "Unknown",
      email: doc.email || ""
    }));
    
    console.log("📋 Returning", plainDoctors.length, "doctors");
    res.status(200).json({ doctors: plainDoctors });
  } catch (error) {
    console.error("Get doctors list error:", error);
    res.status(500).json({ message: "Error fetching doctors" });
  }
});

/**
 * GET doctor profile
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access this" });
    }

    const doctor = await User.findById(req.user.id).select("-password");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE doctor profile
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access this" });
    }

    const { name, email, mobile, gender, dob, address } = req.body;
    
    console.log("📝 Updating doctor profile:", { name, email, mobile });
    
    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, mobile, gender, dob, address },
      { new: true }
    ).select("-password");

    const plainDoctor = {
      id: String(doctor._id),
      name: doctor.name,
      email: doctor.email,
      mobile: doctor.mobile || "",
      gender: doctor.gender || "",
      dob: doctor.dob || "",
      address: doctor.address || "",
      role: doctor.role
    };

    res.status(200).json({ message: "Profile updated", doctor: plainDoctor });
  } catch (error) {
    console.error("Update doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE doctor profile (deactivate account)
 */
router.delete("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can delete their profile" });
    }

    const result = await User.findByIdAndDelete(req.user.id);
    if (!result) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ message: "Doctor profile deleted successfully" });
  } catch (error) {
    console.error("Delete doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET all appointments for doctor
 */
router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access this" });
    }

    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate("patientId", "name email")
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE appointment status
 */
router.put("/appointments/:id/status", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can update appointments" });
    }

    const { status } = req.body;

    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("patientId");

    res.json({
      message: "Appointment status updated",
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
