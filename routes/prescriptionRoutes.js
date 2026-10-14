const express = require("express");
const router = express.Router();

const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/authMiddleware");
const { generatePrescriptionPDF } = require("../utils/prescriptionPDF");
// Note: PDF is generated and saved to Desktop automatically when prescription is created

// ✅ DOCTOR CREATES PRESCRIPTION
router.post("/create", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { appointmentId, diagnosis, medicines, notes } = req.body;

    // Validate required fields
    if (!appointmentId || !diagnosis || !medicines) {
      return res.status(400).json({ 
        message: "Missing required fields: appointmentId, diagnosis, medicines" 
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "name email specialization phone")
      .populate("patientId", "name age phone address email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if it's the doctor's appointment
    const doctorId = appointment.doctorId._id ? appointment.doctorId._id.toString() : appointment.doctorId.toString();
    if (doctorId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed - this is not your appointment" });
    }

    const prescription = new Prescription({
      appointmentId,
      doctorId: req.user.id,
      patientId: appointment.patientId._id,
      diagnosis,
      medicines,
      notes: notes || ""
    });

    await prescription.save();

    // Update appointment with prescription ID
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    // Generate PDF prescription and save to desktop
    let pdfResult = null;
    try {
      pdfResult = await generatePrescriptionPDF({
        doctor: {
          name: appointment.doctorId.name || "Dr. Unknown",
          specialization: appointment.doctorId.specialization || "Medical Physician",
          phone: appointment.doctorId.phone || "+1 302-747-4830"
        },
        patient: {
          name: appointment.patientId.name || "Patient",
          age: appointment.patientId.age || "N/A",
          phone: appointment.patientId.phone || "Not provided",
          address: appointment.patientId.address || "Not provided"
        },
        diagnosis,
        medicines,
        notes,
        prescriptionId: prescription._id.toString()
      });

      console.log("✅ Prescription PDF generated:", pdfResult.filename);
    } catch (pdfError) {
      console.error("⚠️ Warning - PDF generation failed:", pdfError.message);
    }

    console.log("✅ Prescription created:", prescription._id);
    console.log("  - Appointment:", appointmentId);
    console.log("  - Patient:", appointment.patientId.name);
    console.log("  - Doctor:", appointment.doctorId.name);

    res.status(201).json({
      message: "Prescription created successfully and PDF saved to Desktop",
      prescription,
      pdfFile: pdfResult ? pdfResult.filename : null
    });
  } catch (error) {
    console.error("Prescription creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PATIENT VIEWS MY PRESCRIPTIONS (MUST BE BEFORE /:id ROUTE)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    console.log("📋 GET /prescriptions/my - User ID:", req.user.id, "Role:", req.user.role);
    
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Access denied - patient role required" });
    }

    // Convert req.user.id to MongoDB ObjectId for proper comparison
    const mongoose = require("mongoose");
    const userId = mongoose.Types.ObjectId(req.user.id);

    const prescriptions = await Prescription.find({
      patientId: userId
    })
      .populate("doctorId", "name email specialization")
      .populate("appointmentId", "date time status reason");

    console.log("✅ Found", prescriptions.length, "prescriptions for patient", req.user.id);
    prescriptions.forEach(p => {
      console.log("  -", p._id, "for appointment", p.appointmentId);
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error loading prescriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET SPECIFIC PRESCRIPTION BY ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    console.log("📄 GET /prescriptions/:id - ID:", req.params.id);
    
    const prescription = await Prescription.findById(req.params.id)
      .populate("doctorId", "name email specialization phone")
      .populate("patientId", "name email age phone address")
      .populate("appointmentId", "date time reason");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
