/**
 * Input Validation Utilities
 * For validating and sanitizing user inputs across the application
 */

/**
 * Email validation
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Password validation
 * Requirements: 6+ characters minimum
 */
function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * Date validation (YYYY-MM-DD format)
 */
function validateDate(dateString) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Time validation (HH:MM format)
 */
function validateTime(timeString) {
  const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return re.test(timeString);
}

/**
 * Phone validation
 */
function validatePhone(phone) {
  const re = /^[0-9+\-\s()]{10,}$/;
  return re.test(phone);
}

/**
 * Name validation
 */
function validateName(name) {
  const re = /^[a-zA-Z\s]{2,50}$/;
  return re.test(name);
}

/**
 * Sanitize string input
 */
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, "");
}

module.exports = {
  validateEmail,
  validatePassword,
  validateDate,
  validateTime,
  validatePhone,
  validateName,
  sanitizeInput
};
