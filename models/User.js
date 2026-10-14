
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true
    }
    ,
    mobile: {
      type: String,
      required: false
    },
    dob: {
      type: Date,
      required: false
    },
    address: {
      type: String,
      required: false
    },
    gender: {
      type: String,
      enum: ["Male","Female","Other"],
      required: false
    },
    specialization: {
      type: String,
      required: false // Only for doctors
    },
    experience: {
      type: Number,
      required: false // Only for doctors (years)
    },
    qualification: {
      type: String,
      required: false // Only for doctors (e.g., MBBS, MD, DM)
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: false // Only for patients
    },
    allergies: {
      type: String,
      required: false // Only for patients
    },
    emergencyContact: {
      name: {
        type: String,
        required: false
      },
      mobile: {
        type: String,
        required: false
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);






