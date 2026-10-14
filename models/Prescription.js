const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    diagnosis: { 
      type: String, 
      required: true 
    },

    medicines: { 
      type: String,  // Accept as plain text for flexibility
      required: true 
    },

    notes: { 
      type: String,
      default: "" 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);

