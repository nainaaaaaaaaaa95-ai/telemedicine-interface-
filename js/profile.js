const API_URL = "http://localhost:5000/api";
let currentUser = {};
let changePasswordModal = null;
let emergencyContactModal = null;
let viewingUserId = null; // For viewing other users' profiles
let isViewMode = false; // Read-only mode for viewing others

document.addEventListener("DOMContentLoaded", initializeProfile);

/**
 * Initialize profile page
 */
async function initializeProfile() {
  console.log("📋 Initializing profile page...");
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const viewParam = new URLSearchParams(window.location.search).get("view");

  if (!token || !user.role) {
    alert("Please login first");
    window.location.href = "/html/login.html";
    return;
  }

  currentUser = user;
  
  // Check if viewing another user's profile
  if (viewParam) {
    console.log("👁️ Viewing profile for user/patient ID:", viewParam);
    viewingUserId = viewParam;
    isViewMode = true;
  }

  try {
    changePasswordModal = new bootstrap.Modal(document.getElementById("changePasswordModal"));
    emergencyContactModal = new bootstrap.Modal(document.getElementById("emergencyContactModal"));
  } catch (e) {
    console.warn("Modal elements not found (expected in view mode)");
  }

  // Update UI based on view mode
  updateUIForMode();
  
  // Show/hide patient and doctor fields
  togglePatientFields();
  toggleDoctorFields();
  
  // Attach event listeners
  attachEventListeners();
  
  // Load profile data
  await readProfile(token);
}

/**
 * Update UI based on whether viewing own profile or another user's
 */
function updateUIForMode() {
  const profileTitle = document.getElementById("profileTitle");
  const namebarText = document.querySelector(".navbar-text");
  
  if (isViewMode) {
    profileTitle.textContent = "Patient Profile (View Only)";
    if (namebarText) namebarText.textContent = "Patient Profile";
    
    // Disable all form inputs
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.id !== "role") { // role is already read-only
        el.disabled = true;
      }
    });
    
    // Hide edit/delete buttons
    const readBtn = document.getElementById("readBtn");
    const updateBtn = document.getElementById("updateBtn");
    const resetBtn = document.getElementById("resetBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const emergencyBtn = document.getElementById("emergencyBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    
    if (readBtn) readBtn.style.display = "none";
    if (updateBtn) updateBtn.style.display = "none";
    if (resetBtn) resetBtn.style.display = "none";
    if (changePasswordBtn) changePasswordBtn.style.display = "none";
    if (emergencyBtn) emergencyBtn.style.display = "none";
    if (deleteBtn) deleteBtn.style.display = "none";
  }
}

/**
 * Toggle patient-only fields based on role
 */
function togglePatientFields() {
  const patientFields = document.getElementById("patientFields");
  const emergencyBtn = document.getElementById("emergencyBtn");
  const prescriptionBtn = document.getElementById("prescriptionBtn");
  
  let shouldShow = false;
  
  if (isViewMode) {
    // In view mode, always show patient fields since we're viewing a patient
    shouldShow = true;
  } else {
    // Otherwise show if current user is a patient
    shouldShow = currentUser.role === "patient";
  }
  
  if (shouldShow) {
    patientFields.style.display = "block";
    if (emergencyBtn) emergencyBtn.style.display = "block";
    if (prescriptionBtn) prescriptionBtn.style.display = "block";
  } else {
    patientFields.style.display = "none";
    if (emergencyBtn) emergencyBtn.style.display = "none";
    if (prescriptionBtn) prescriptionBtn.style.display = "none";
  }
}

/**
 * Toggle doctor-only fields based on role
 */
function toggleDoctorFields() {
  const doctorFields = document.getElementById("doctorFields");
  
  let shouldShow = false;
  
  if (isViewMode) {
    // In view mode, don't show doctor fields - we're viewing a patient
    shouldShow = false;
  } else {
    // Otherwise show if current user is a doctor
    shouldShow = currentUser.role === "doctor";
  }
  
  if (shouldShow) {
    doctorFields.style.display = "block";
  } else {
    doctorFields.style.display = "none";
  }
}

/**
 * Attach event listeners to buttons and forms
 */
function attachEventListeners() {
  const profileForm = document.getElementById("profileForm");
  const readBtn = document.getElementById("readBtn");
  const updateBtn = document.getElementById("updateBtn");
  const resetBtn = document.getElementById("resetBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const emergencyBtn = document.getElementById("emergencyBtn");
  const prescriptionBtn = document.getElementById("prescriptionBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const savePasswordBtn = document.getElementById("savePasswordBtn");
  const saveEmergencyBtn = document.getElementById("saveEmergencyBtn");

  // In view mode, don't attach form submission
  if (!isViewMode && profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      updateProfile();
    });
  }

  // Only attach listeners for buttons that will be visible
  if (!isViewMode) {
    if (readBtn) readBtn.addEventListener("click", () => readProfile(localStorage.getItem("token")));
    if (updateBtn) updateBtn.addEventListener("click", updateProfile);
    if (resetBtn) resetBtn.addEventListener("click", resetForm);
    if (changePasswordBtn) changePasswordBtn.addEventListener("click", () => changePasswordModal.show());
    if (emergencyBtn) emergencyBtn.addEventListener("click", showEmergencyContactModal);
    if (prescriptionBtn) prescriptionBtn.addEventListener("click", viewMyPrescriptions);
    if (deleteBtn) deleteBtn.addEventListener("click", deleteProfile);
    if (savePasswordBtn) savePasswordBtn.addEventListener("click", savePassword);
    if (saveEmergencyBtn) saveEmergencyBtn.addEventListener("click", saveEmergencyContact);
  }
}

/**
 * READ - Fetch current user profile or another user's profile
 */
async function readProfile(token) {
  try {
    console.log("🔍 Fetching profile. View mode:", isViewMode, "Viewing user ID:", viewingUserId);
    
    let endpoint;
    
    if (isViewMode && viewingUserId) {
      // Viewing another user's profile (patient)
      console.log("📖 Loading patient profile from appointment...");
      endpoint = `${API_URL}/patients/${viewingUserId}`;
    } else {
      // Loading own profile
      console.log("🔍 Fetching profile for role:", currentUser.role);
      endpoint = currentUser.role === "doctor" 
        ? `${API_URL}/doctors/profile`
        : `${API_URL}/patients/profile`;
    }

    const response = await fetch(endpoint, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn("Could not fetch profile from backend");
      showAlert("Could not load profile", "warning");
      return;
    }

    const data = await response.json();
    const profile = data.doctor || data.patient || data || {};
    
    console.log("✅ Loaded profile:", profile);
    displayProfile(profile);
    showAlert("Profile loaded successfully", "success");

  } catch (error) {
    console.error("Error fetching profile:", error);
    showAlert(`Error loading profile: ${error.message}`, "danger");
  }
}

/**
 * UPDATE - Save profile changes
 */
async function updateProfile() {
  const token = localStorage.getItem("token");
  
  try {
    // Validate form
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    const address = document.getElementById("address").value.trim();

    if (!name || !email) {
      showAlert("Name and Email are required", "warning");
      return;
    }

    console.log("📝 Updating profile...");
    
    const endpoint = currentUser.role === "doctor"
      ? `${API_URL}/doctors/profile`
      : `${API_URL}/patients/profile`;

    // Build payload
    const payload = {
      name,
      email,
      mobile,
      gender,
      dob,
      address
    };

    // Add doctor-specific fields
    if (currentUser.role === "doctor") {
      const specialization = document.getElementById("specialization").value.trim();
      const experience = document.getElementById("experience").value.trim();
      const qualification = document.getElementById("qualification").value.trim();
      if (specialization) payload.specialization = specialization;
      if (experience) payload.experience = parseInt(experience) || 0;
      if (qualification) payload.qualification = qualification;
    }

    // Add patient-specific fields
    if (currentUser.role === "patient") {
      const bloodGroup = document.getElementById("bloodGroup").value;
      const allergies = document.getElementById("allergies").value.trim();
      if (bloodGroup) payload.bloodGroup = bloodGroup;
      if (allergies) payload.allergies = allergies;
    }

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(`Update failed: ${data.message}`, "danger");
      return;
    }

    console.log("✅ Profile updated successfully");
    showAlert("✅ Profile updated successfully!", "success");
    
    // Update localStorage
    if (data.doctor || data.patient) {
      const updatedUser = data.doctor || data.patient;
      localStorage.setItem("user", JSON.stringify({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: currentUser.role
      }));
    }

  } catch (error) {
    console.error("Error updating profile:", error);
    showAlert(`Error: ${error.message}`, "danger");
  }
}

/**
 * DELETE - Remove user profile
 */
async function deleteProfile() {
  const token = localStorage.getItem("token");
  
  const confirmed = confirm(
    "⚠️ WARNING: This action cannot be undone!\n\n" +
    "Are you sure you want to permanently delete your account?\n\n" +
    "Type 'DELETE' to confirm:"
  );

  if (!confirmed) return;

  const confirmText = prompt("Please type 'DELETE' to confirm account deletion:");
  if (confirmText !== "DELETE") {
    showAlert("Account deletion cancelled", "info");
    return;
  }

  try {
    console.log("🗑️ Deleting profile...");
    
    const endpoint = currentUser.role === "doctor"
      ? `${API_URL}/doctors/profile`
      : `${API_URL}/patients/profile`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(`Delete failed: ${data.message}`, "danger");
      return;
    }

    console.log("✅ Profile deleted successfully");
    showAlert("✅ Account deleted. Logging out...", "success");
    
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = "/html/login.html";
    }, 2000);

  } catch (error) {
    console.error("Error deleting profile:", error);
    showAlert(`Error: ${error.message}`, "danger");
  }
}

/**
 * Display profile data in form
 */
function displayProfile(profile) {
  document.getElementById("name").value = profile.name || "";
  document.getElementById("email").value = profile.email || "";
  document.getElementById("mobile").value = profile.mobile || "";
  document.getElementById("gender").value = profile.gender || "";
  document.getElementById("dob").value = profile.dob ? profile.dob.split('T')[0] : "";
  document.getElementById("address").value = profile.address || "";
  
  // Set role - in view mode, show patient role; otherwise show current user role
  const roleValue = isViewMode ? "patient" : (profile.role || currentUser.role);
  document.getElementById("role").value = roleValue;
  
  // Set role tag
  const roleTag = document.getElementById("roleTag");
  if (roleTag) {
    const displayRole = isViewMode ? "patient" : currentUser.role;
    roleTag.textContent = `(${displayRole.charAt(0).toUpperCase() + displayRole.slice(1)})`;
  }

  // Load doctor-specific fields (only if current user is doctor and not in view mode)
  if (!isViewMode && currentUser.role === "doctor") {
    document.getElementById("specialization").value = profile.specialization || "";
    document.getElementById("experience").value = profile.experience || "";
    document.getElementById("qualification").value = profile.qualification || "";
  }

  // Load patient-specific fields
  if (profile.bloodGroup !== undefined || profile.allergies !== undefined) {
    document.getElementById("bloodGroup").value = profile.bloodGroup || "";
    document.getElementById("allergies").value = profile.allergies || "";
    
    // Load emergency contact info
    if (profile.emergencyContact) {
      document.getElementById("emergencyName").value = profile.emergencyContact.name || "";
      document.getElementById("emergencyMobile").value = profile.emergencyContact.mobile || "";
    }
  }

  // Display additional info
  const additionalInfo = document.getElementById("additionalInfo");
  if (additionalInfo) {
    document.getElementById("accountId").textContent = profile.id || profile._id || "-";
    
    if (profile.createdAt) {
      const joinDate = new Date(profile.createdAt);
      document.getElementById("memberSince").textContent = joinDate.toLocaleDateString();
    }
    
    if (profile.updatedAt) {
      const lastUpdate = new Date(profile.updatedAt);
      document.getElementById("lastUpdated").textContent = lastUpdate.toLocaleDateString();
    }
    
    additionalInfo.style.display = "block";
  }
}

/**
 * Reset form to original values
 */
function resetForm() {
  readProfile(localStorage.getItem("token"));
  showAlert("Form reset to original values", "info");
}

/**
 * Save password change
 */
async function savePassword() {
  const token = localStorage.getItem("token");
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert("All password fields are required", "warning");
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert("New passwords do not match", "warning");
    return;
  }

  if (newPassword.length < 6) {
    showAlert("New password must be at least 6 characters", "warning");
    return;
  }

  try {
    console.log("🔐 Changing password...");
    
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(`Error: ${data.message}`, "danger");
      return;
    }

    showAlert("✅ Password changed successfully!", "success");
    
    // Clear form and close modal
    document.getElementById("changePasswordForm").reset();
    changePasswordModal.hide();

  } catch (error) {
    console.error("Error changing password:", error);
    showAlert(`Error: ${error.message}`, "danger");
  }
}

/**
 * Show emergency contact modal
 */
function showEmergencyContactModal() {
  const token = localStorage.getItem("token");
  
  // Fetch current emergency contact info
  readProfile(token).then(() => {
    emergencyContactModal.show();
  });
}

/**
 * Save emergency contact
 */
async function saveEmergencyContact() {
  const token = localStorage.getItem("token");
  
  try {
    const emergencyName = document.getElementById("emergencyName").value.trim();
    const emergencyMobile = document.getElementById("emergencyMobile").value.trim();

    if (!emergencyName || !emergencyMobile) {
      showAlert("Contact name and mobile number are required", "warning");
      return;
    }

    if (!/^\d{10}$/.test(emergencyMobile.replace(/[^\d]/g, ''))) {
      showAlert("Please enter a valid 10-digit mobile number", "warning");
      return;
    }

    console.log("📞 Saving emergency contact...");
    
    const endpoint = `${API_URL}/patients/profile`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        emergencyContact: {
          name: emergencyName,
          mobile: emergencyMobile
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(`Error: ${data.message}`, "danger");
      return;
    }

    console.log("✅ Emergency contact saved successfully");
    showAlert("✅ Emergency contact saved successfully!", "success");
    
    // Close modal
    emergencyContactModal.hide();
    
    // Reset form
    document.getElementById("emergencyContactForm").reset();

  } catch (error) {
    console.error("Error saving emergency contact:", error);
    showAlert(`Error: ${error.message}`, "danger");
  }
}

/**
 * Show alert message
 */
function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer");
  const alertId = "alert-" + Date.now();
  
  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>${type === "success" ? "✅" : type === "danger" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"}</strong>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  alertContainer.innerHTML += alertHTML;

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

/**
 * View my prescriptions - redirect to prescriptions page
 */
function viewMyPrescriptions() {
  try {
    console.log("📋 Opening prescriptions page...");
    window.location.href = "/html/myprescriptions.html";
  } catch (error) {
    console.error("Error opening prescriptions:", error);
    showAlert(`Error: ${error.message}`, "danger");
  }
}

