const express = require("express");
const mongoose = require("mongoose"); // Add for ObjectId validation
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

// ✅ GET patient profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can access this" });
    }

    const patient = await User.findById(req.user.id).select("-password");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const plainPatient = {
      id: String(patient._id),
      name: patient.name,
      email: patient.email,
      mobile: patient.mobile || "",
      gender: patient.gender || "",
      dob: patient.dob || "",
      address: patient.address || "",
      role: patient.role
    };

    res.status(200).json({ patient: plainPatient });
  } catch (error) {
    console.error("Get patient error:", error); // Added logging
    res.status(500).json({ message: "Internal server error" }); // More generic for security
  }
});

// ✅ UPDATE patient profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can access this" });
    }

    const { name, email, mobile, gender, dob, address } = req.body;
    
    console.log("📝 Updating patient profile:", { name, email, mobile });
    
    const patient = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, mobile, gender, dob, address },
      { new: true }
    ).select("-password");

    const plainPatient = {
      id: String(patient._id),
      name: patient.name,
      email: patient.email,
      mobile: patient.mobile || "",
      gender: patient.gender || "",
      dob: patient.dob || "",
      address: patient.address || "",
      role: patient.role
    };

    res.status(200).json({ message: "Profile updated", patient: plainPatient });
  } catch (error) {
    console.error("Update patient error:", error); // Added logging
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ DELETE patient profile (deactivate account)
router.delete("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "Only patients can delete their profile" });
    }

    const result = await User.findByIdAndDelete(req.user.id);
    if (!result) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({ message: "Patient profile deleted successfully" });
  } catch (error) {
    console.error("Delete patient error:", error); // Added logging
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ GET patient profile by ID (for doctors) - Updated with suggestions
router.get("/:patientId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access patient profiles" });
    }

    // Added: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await User.findById(req.params.patientId).select("-password");
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Optional: Uncomment for stricter authorization (e.g., check if doctor is assigned)
    // if (!patient.assignedDoctors.includes(req.user.id)) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const plainPatient = {
      id: String(patient._id),
      name: patient.name,
      email: patient.email,
      mobile: patient.mobile || "",
      gender: patient.gender || "",
      dob: patient.dob || "",
      address: patient.address || ""
      // Note: 'role' excluded for doctors to avoid unnecessary data exposure
    };

    res.status(200).json({ patient: plainPatient });
  } catch (error) {
    console.error("Get patient by ID error:", error); // Added logging
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;