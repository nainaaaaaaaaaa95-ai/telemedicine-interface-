const API_URL = "http://localhost:5000/api";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
    console.log("✅ Signup form listener attached");
  } else {
    console.error("❌ Signup form not found in DOM");
  }
});

/**
 * Toggle doctor-specific fields based on role selection
 */
function toggleDoctorFields() {
  const role = document.getElementById("role").value;
  const doctorFields = document.getElementById("doctorFields");
  const specializationInput = document.getElementById("specialization");
  const experienceInput = document.getElementById("experience");
  
  if (role === "doctor") {
    // Show doctor fields
    doctorFields.style.display = "block";
    specializationInput.required = true;
    experienceInput.required = true;
    console.log("✅ Doctor fields shown and set as required");
  } else {
    // Hide doctor fields
    doctorFields.style.display = "none";
    specializationInput.required = false;
    experienceInput.required = false;
    specializationInput.value = "";
    experienceInput.value = "";
    console.log("✅ Doctor fields hidden");
  }
}

/**
 * Handle signup form submission
 */
async function handleSignup(e) {
  e.preventDefault();

  // Get form values using the IDs we added
  const firstName = document.getElementById("firstName")?.value.trim() || "";
  const lastName = document.getElementById("lastName")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value || "";
  const role = document.getElementById("role")?.value || "";

  // Validate inputs
  if (!firstName || firstName.length < 2) {
    alert("First name must be at least 2 characters");
    return;
  }
  if (!lastName || lastName.length < 2) {
    alert("Last name must be at least 2 characters");
    return;
  }
  if (!email || !isValidEmail(email)) {
    alert("Please enter a valid email address");
    return;
  }
  if (!password || password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }
  if (!role) {
    alert("Please select a role (Patient or Doctor)");
    return;
  }

  // Show loading state
  const submitBtn = document.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    // collect optional fields
    const mobile = document.getElementById("mobile")?.value.trim() || "";
    const dob = document.getElementById("dob")?.value || "";
    const address = document.getElementById("address")?.value.trim() || "";
    const gender = document.getElementById("gender")?.value || "";

    console.log("Sending signup request to:", `${API_URL}/auth/signup`);
    const signupData = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      role,
      mobile,
      dob,
      address,
      gender
    };

    // Add doctor-specific fields if registering as doctor
    if (role === "doctor") {
      const specialization = document.getElementById("specialization")?.value.trim() || "";
      const experience = document.getElementById("experience")?.value || "";
      
      if (!specialization) {
        alert("❌ Specialization is required for doctors");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      if (!experience || experience < 0) {
        alert("❌ Years of experience is required for doctors");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      
      signupData.specialization = specialization;
      signupData.experience = parseInt(experience);
      console.log("✅ Doctor fields added - Specialization:", specialization, "Experience:", experience);
    }
    
    console.log("Data:", signupData);

    // Make API call
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signupData)
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Response ok:", response.ok);
    
    let data;
    try {
      data = await response.json();
      console.log("Successfully parsed JSON:", data);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("Response status:", response.status);
      try {
        const text = await response.text();
        console.error("Response text:", text);
      } catch (e) {
        console.error("Could not read response text");
      }
      alert("❌ Server error: Could not parse response. Check console for details.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    console.log("Parsed response:", data);

    if (!response.ok) {
      alert(`❌ Signup failed: ${data.message || "Unknown error"}`);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    // Success - Save token and user info to localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
    }

    alert("✅ Account created successfully! Redirecting to dashboard...");

    setTimeout(() => {
      // Redirect to appropriate dashboard based on role
      if (role === "doctor") {
        window.location.href = "/html/drdash.html";
      } else {
        window.location.href = "/html/patientdash.html";
      }
    }, 1500);

  } catch (error) {
    console.error("❌ Signup error:", error);
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    
    let errorMessage = error.message;
    if (error instanceof TypeError) {
      errorMessage = "Network error - Failed to reach server. Make sure backend is running on http://localhost:5000";
    }
    
    alert(`❌ Error: ${errorMessage}`);
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
  
