const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token and attach user to request
 */
const authMiddleware = (req, res, next) => {
  try {
    // ✅ Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "No authentication token provided" 
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    // ✅ Verify token (use same secret as signup/login)
    const secret = process.env.JWT_SECRET || "test_secret_key";
    const decoded = jwt.verify(token, secret);

    // ✅ Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token has expired. Please login again." 
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Invalid token" 
      });
    }

    return res.status(401).json({ 
      message: "Authentication failed"
    });
  }
};

module.exports = authMiddleware;
