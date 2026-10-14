const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail, validatePassword } = require("../utils/validators");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", async (req, res) => {
  try {
    console.log("📝 Signup request received:", req.body);
    const { name, email, password, role, mobile, dob, address, gender, specialization, experience } = req.body;

    // ✅ Input Validation
    if (!name || !email || !password || !role) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // ✅ Validate doctor-specific fields for doctors
    if (role.toLowerCase() === "doctor") {
      if (!specialization || !specialization.trim()) {
        console.log("❌ Specialization required for doctors");
        return res.status(400).json({ 
          message: "Specialization is required for doctors" 
        });
      }
      if (experience === undefined || experience === null || experience < 0) {
        console.log("❌ Experience required for doctors");
        return res.status(400).json({ 
          message: "Years of experience is required for doctors" 
        });
      }
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        message: "Invalid email format" 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    if (!["patient", "doctor"].includes(role.toLowerCase())) {
      return res.status(400).json({ 
        message: "Invalid role" 
      });
    }

    console.log("🔍 Checking if user exists...");
    // ✅ Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: "Email already registered" 
      });
    }

    console.log("🔐 Hashing password...");
    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("💾 Creating new user...");
    // ✅ Create user (include optional fields if provided)
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      mobile: mobile || null,
      dob: dob ? new Date(dob) : null,
      address: address || null,
      gender: gender || null
    };

    // Add doctor-specific fields
    if (role.toLowerCase() === "doctor") {
      userData.specialization = specialization.trim();
      userData.experience = parseInt(experience);
      console.log("✅ Doctor fields added - Specialization:", userData.specialization, "Experience:", userData.experience);
    }

    const user = new User(userData);
    await user.save();
    console.log("✅ User saved successfully");

    console.log("🎫 Generating JWT token...");
    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "test_secret_key",
      { expiresIn: "24h" }
    );

    console.log("✨ Sending success response...");
    console.log("Token:", token.substring(0, 20) + "...");
    
    // Create plain JavaScript object instead of Mongoose doc
    const plainUser = {
      id: String(user._id),
      name: user.name || "",
      email: user.email || "",
      role: user.role || ""
    };
    
    console.log("User object created");
    
    const responseObj = {
      message: "User registered successfully",
      token: token,
      user: plainUser
    };
    
    console.log("Response object created, sending...");
    res.status(201).json(responseObj);
    console.log("Response sent!");

  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ 
      message: "Server error during registration",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Input Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // ✅ Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // ✅ Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "test_secret_key",
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ 
      message: "Server error during login",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post("/logout", (req, res) => {
  res.status(200).json({ 
    message: "Logout successful. Please delete your token from client storage."
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      message: "Server error fetching profile"
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private (authenticated)
 */
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password changed for user:", user._id);
    res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ 
      message: "Server error while changing password" 
    });
  }
});

module.exports = router;
