const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/authMiddleware");
const { validateDate, validateTime } = require("../utils/validators");

/**
 * @route   POST /api/appointments/book
 * @desc    Patient books appointment with doctor
 * @access  Private (Patient only)
 */
router.post("/book", authMiddleware, async (req, res) => {
  try {
    console.log("📋 Appointment book request received");
    console.log("User:", req.user);
    console.log("Request body:", req.body);
    
    const { doctorId, date, time, reason } = req.body;

    // ✅ Authorization check
    if (req.user.role !== "patient") {
      console.log("❌ User is not a patient:", req.user.role);
      return res.status(403).json({ 
        message: "Only patients can book appointments" 
      });
    }

    // ✅ Input validation
    if (!doctorId || !date || !time) {
      console.log("❌ Missing required fields:", { doctorId, date, time });
      return res.status(400).json({ 
        message: "Doctor ID, date, and time are required" 
      });
    }

    if (!validateDate(date)) {
      console.log("❌ Invalid date:", date);
      return res.status(400).json({ 
        message: "Invalid date format (use YYYY-MM-DD)" 
      });
    }

    if (!validateTime(time)) {
      console.log("❌ Invalid time:", time);
      return res.status(400).json({ 
        message: "Invalid time format (use HH:MM)" 
      });
    }

    // ✅ Check if doctor exists
    const User = require("../models/User");
    console.log("🔍 Checking if doctor exists with ID:", doctorId);
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      console.log("❌ Doctor not found or not a doctor");
      return res.status(404).json({ 
        message: "Doctor not found" 
      });
    }

    console.log("✅ Doctor found:", doctor.name);

    // ✅ Check for duplicate appointment
    const existingAppointment = await Appointment.findOne({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      status: { $in: ["pending", "accepted"] }
    });

    if (existingAppointment) {
      console.log("❌ Duplicate appointment found");
      return res.status(409).json({ 
        message: "You already have an appointment at this time with this doctor" 
      });
    }

    console.log("💾 Creating appointment...");
    // ✅ Create appointment
    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      reason: reason || "",
      status: "pending"
    });

    await appointment.save();
    console.log("✅ Appointment saved successfully");
    
    await appointment.populate("doctorId", "name email");

    const plainAppointment = {
      id: String(appointment._id),
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      status: appointment.status
    };

    console.log("✨ Sending success response");
    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: plainAppointment
    });

  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ 
      message: "Error booking appointment",
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/appointments/my
 * @desc    Get patient's appointments
 * @access  Private (Patient only)
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    const appointments = await Appointment.find({
      patientId: req.user.id
    })
      .populate("doctorId", "name email specialization")
      .sort({ date: -1 });

    res.status(200).json({
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error("Fetch appointments error:", error);
    res.status(500).json({ 
      message: "Error fetching appointments" 
    });
  }
});

/**
 * @route   GET /api/appointments/doctor
 * @desc    Get doctor's appointments
 * @access  Private (Doctor only)
 */
router.get("/doctor", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // ✅ Build filter
    const filter = { doctorId: req.user.id };
    if (status && ["pending", "accepted", "rejected", "completed"].includes(status)) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email")
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      appointments
    });

  } catch (error) {
    console.error("Fetch doctor appointments error:", error);
    res.status(500).json({ 
      message: "Error fetching appointments" 
    });
  }
});

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status (doctor only)
 * @access  Private (Doctor only)
 */
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // ✅ Authorization
    if (req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Only doctors can update appointment status" 
      });
    }

    // ✅ Validate status
    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be: accepted, rejected, or completed" 
      });
    }

    // ✅ Find and verify appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "You can only update your own appointments" 
      });
    }

    // ✅ Update status
    appointment.status = status;
    await appointment.save();
    await appointment.populate("patientId", "name email");

    res.status(200).json({
      message: `Appointment ${status}`,
      appointment
    });

  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ 
      message: "Error updating appointment status" 
    });
  }
});

/**
 * @route   PATCH /api/appointments/:id/meetlink
 * @desc    Update Google Meet link for appointment (doctor only)
 * @access  Private (Doctor only)
 */
router.patch("/:id/meetlink", authMiddleware, async (req, res) => {
  try {
    const { meetLink } = req.body;
    const { id } = req.params;

    // ✅ Authorization
    if (req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Only doctors can add meeting links" 
      });
    }

    // ✅ Validate meetLink
    if (!meetLink || typeof meetLink !== 'string') {
      return res.status(400).json({ 
        message: "Valid Google Meet link is required" 
      });
    }

    // ✅ Find and verify appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "You can only update your own appointments" 
      });
    }

    // ✅ Update meetLink
    appointment.meetLink = meetLink;
    await appointment.save();
    await appointment.populate("patientId", "name email");

    res.status(200).json({
      message: "Meeting link added",
      appointment
    });

  } catch (error) {
    console.error("Update meetlink error:", error);
    res.status(500).json({ 
      message: "Error updating meeting link" 
    });
  }
});

/**
 * @desc    Get appointment details
 * @access  Private
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    if (!appointment) {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    // ✅ Check authorization
    const isOwner = 
      (req.user.role === "patient" && appointment.patientId._id.toString() === req.user.id) ||
      (req.user.role === "doctor" && appointment.doctorId._id.toString() === req.user.id);

    if (!isOwner) {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    res.status(200).json(appointment);

  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ 
      message: "Error fetching appointment" 
    });
  }
});

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment (patient before confirmation, doctor anytime)
 * @access  Private
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        message: "Appointment not found" 
      });
    }

    // ✅ Authorization
    const isPatient = req.user.role === "patient" && 
                     appointment.patientId.toString() === req.user.id;
    const isDoctor = req.user.role === "doctor" && 
                    appointment.doctorId.toString() === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    // ✅ Check if cancellable
    if (isPatient && appointment.status === "accepted") {
      return res.status(400).json({ 
        message: "Cannot cancel accepted appointment" 
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: "Appointment cancelled" 
    });

  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ 
      message: "Error cancelling appointment" 
    });
  }
});

module.exports = router;
