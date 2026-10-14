const API_URL = "http://localhost:5000/api";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    console.log("✅ Login form listener attached");
  } else {
    console.error("❌ Login form not found in DOM");
  }
});

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  // ✅ Clear previous errors
  clearErrors();

  // ✅ Get form values
  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value || "";
  const role = document.getElementById("role").value;

  // ✅ Validate inputs
  const errors = validateLoginForm(email, password, role);
  if (Object.keys(errors).length > 0) {
    displayErrors(errors);
    return;
  }

  // ✅ Show loading state
  const submitBtn = document.getElementById("submitBtn") || document.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    // ✅ Make API call
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert("error", `❌ ${data.message || "Login failed"}`);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // ✅ Validate role matches (security check)
    if (data.user.role !== role) {
      showAlert("error", "❌ Selected role does not match your account");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // ✅ Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", data.user.role);

    // ✅ Redirect based on role
    showAlert("success", "✅ Login successful! Redirecting...");

    setTimeout(() => {
      if (role === "doctor") {
        window.location.href = "/html/drdash.html";
      } else {
        window.location.href = "/html/patientdash.html";
      }
    }, 1000);

  } catch (error) {
    console.error("Login error:", error);
    showAlert("error", `❌ Network error: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Validate login form inputs
 */
function validateLoginForm(email, password, role) {
  const errors = {};

  if (!email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email format";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!role) {
    errors.role = "Please select a role";
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Display validation errors
 */
function displayErrors(errors) {
  if (errors.email) {
    const errorEl = document.getElementById("emailError");
    if (errorEl) errorEl.textContent = errors.email;
  }
  if (errors.password) {
    const errorEl = document.getElementById("passwordError");
    if (errorEl) errorEl.textContent = errors.password;
  }
  if (errors.role) {
    const errorEl = document.getElementById("roleError");
    if (errorEl) errorEl.textContent = errors.role;
  }
}

/**
 * Clear error messages
 */
function clearErrors() {
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const roleError = document.getElementById("roleError");
  
  if (emailError) emailError.textContent = "";
  if (passwordError) passwordError.textContent = "";
  if (roleError) roleError.textContent = "";
}

/**
 * Show alert message
 */
function showAlert(type, message) {
  const container = document.getElementById("alertContainer");
  if (!container) {
    alert(message);
    return;
  }
  
  const alertClass = type === "error" ? "alert-danger" : "alert-success";
  
  container.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}
