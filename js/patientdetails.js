const API_URL = "http://localhost:5000/api";
let currentPatient = {};
let currentAppointment = {};
let currentAppointmentId = null;

document.addEventListener("DOMContentLoaded", initializePatientDetails);

/**
 * Initialize patient details page
 */
async function initializePatientDetails() {
  console.log("👤 Initializing patient details page...");
  
  const token = localStorage.getItem("token");
  const appointmentId = new URLSearchParams(window.location.search).get("appointmentId");
  
  if (!token) {
    alert("Please login first");
    window.location.href = "/html/login.html";
    return;
  }

  if (!appointmentId) {
    alert("No appointment selected");
    window.location.href = "/html/drdash.html";
    return;
  }

  currentAppointmentId = appointmentId;
  
  // Load patient and appointment details
  await loadPatientDetails(token, appointmentId);
  
  // Attach event listeners
  attachEventListeners();
}

/**
 * Load patient and appointment details from backend
 */
async function loadPatientDetails(token, appointmentId) {
  try {
    console.log("📖 Fetching appointment details for ID:", appointmentId);
    
    // Fetch appointment details
    const appointmentResponse = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!appointmentResponse.ok) {
      throw new Error("Failed to fetch appointment details");
    }

    const appointmentData = await appointmentResponse.json();
    const appointment = appointmentData.appointment || appointmentData;
    
    console.log("✅ Appointment data:", appointment);
    
    // Store appointment data
    currentAppointment = appointment;

    // Get patient ID from appointment
    const patientId = appointment.patientId?._id || appointment.patientId;
    
    if (!patientId) {
      throw new Error("Patient ID not found in appointment");
    }

    // Fetch patient profile
    const patientResponse = await fetch(`${API_URL}/patients/${patientId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!patientResponse.ok) {
      throw new Error("Failed to fetch patient details");
    }

    const patientData = await patientResponse.json();
    currentPatient = patientData.patient || patientData;
    
    console.log("✅ Patient data:", currentPatient);

    // Display patient information
    displayPatientInfo(currentPatient);
    
    // Display appointment status
    displayAppointmentStatus();

  } catch (error) {
    console.error("❌ Error loading patient details:", error);
    alert(`Error: ${error.message}`);
    window.location.href = "/html/drdash.html";
  }
}

/**
 * Display patient information on the page
 */
function displayPatientInfo(patient) {
  // Header name
  document.getElementById("patientName").innerHTML = 
    `<i class="fas fa-user-circle"></i> ${patient.name || 'Patient'}`;

  // Personal Information
  document.getElementById("displayName").textContent = patient.name || "-";
  document.getElementById("displayEmail").textContent = patient.email || "-";
  document.getElementById("displayMobile").textContent = patient.mobile || "-";
  document.getElementById("displayGender").textContent = patient.gender || "-";
  
  if (patient.dob) {
    const dobDate = new Date(patient.dob);
    document.getElementById("displayDOB").textContent = dobDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else {
    document.getElementById("displayDOB").textContent = "-";
  }
  
  document.getElementById("displayAddress").textContent = patient.address || "-";

  // Health Information (if available)
  if (patient.bloodGroup || patient.allergies) {
    document.getElementById("healthSection").style.display = "block";
    document.getElementById("displayBloodGroup").textContent = patient.bloodGroup || "-";
    document.getElementById("displayAllergies").textContent = patient.allergies || "-";
  }

  // Emergency Contact (if available)
  if (patient.emergencyContact) {
    document.getElementById("emergencySection").style.display = "block";
    document.getElementById("displayEmergencyName").textContent = patient.emergencyContact.name || "-";
    document.getElementById("displayEmergencyMobile").textContent = patient.emergencyContact.mobile || "-";
  }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const meetLinkForm = document.getElementById("meetLinkForm");
  const prescriptionForm = document.getElementById("prescriptionForm");
  
  if (meetLinkForm) {
    meetLinkForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveMeetLink();
    });
  }

  if (prescriptionForm) {
    prescriptionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      savePrescription();
    });
  }
}

/**
 * Save meet link to the appointment
 */
async function saveMeetLink() {
  const token = localStorage.getItem("token");
  const meetLink = document.getElementById("meetLinkInput").value.trim();
  const meetStatus = document.getElementById("meetStatus");

  if (!meetLink) {
    showStatus("Please enter a valid Google Meet link", "warning", meetStatus);
    return;
  }

  // Basic URL validation
  if (!meetLink.startsWith("http://") && !meetLink.startsWith("https://")) {
    showStatus("Link must start with http:// or https://", "warning", meetStatus);
    return;
  }

  try {
    console.log("📤 Saving meet link for appointment:", currentAppointmentId);
    
    const response = await fetch(`${API_URL}/appointments/${currentAppointmentId}/meetlink`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ meetLink })
    });

    const data = await response.json();
    console.log("📥 Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to save meet link");
    }

    showStatus("✅ Google Meet link saved successfully! Patients will see it on their dashboard.", "success", meetStatus);
    
    // Clear input after successful save
    setTimeout(() => {
      document.getElementById("meetLinkInput").value = "";
    }, 1500);

  } catch (error) {
    console.error("❌ Error saving meet link:", error);
    showStatus(`Error: ${error.message}`, "danger", meetStatus);
  }
}

/**
 * Clear meet link input
 */
function clearMeetLink() {
  document.getElementById("meetLinkInput").value = "";
  document.getElementById("meetStatus").innerHTML = "";
}

/**
 * Clear prescription inputs
 */
function clearPrescription() {
  document.getElementById("diagnosisInput").value = "";
  document.getElementById("medicinesInput").value = "";
  document.getElementById("notesInput").value = "";
  document.getElementById("prescriptionStatus").innerHTML = "";
}

/**
 * Show status message
 */
function showStatus(message, type, container) {
  const alertClass = {
    'success': 'alert-success',
    'warning': 'alert-warning',
    'danger': 'alert-danger',
    'info': 'alert-info'
  }[type] || 'alert-info';

  container.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show border-0" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

/**
 * Save prescription to the appointment
 */
async function savePrescription() {
  const token = localStorage.getItem("token");
  const diagnosis = document.getElementById("diagnosisInput").value.trim();
  const medicines = document.getElementById("medicinesInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();
  const prescriptionStatus = document.getElementById("prescriptionStatus");

  if (!diagnosis || !medicines) {
    showStatus("❌ Please fill in diagnosis and medicines", "warning", prescriptionStatus);
    return;
  }

  try {
    console.log("📤 Creating prescription for appointment:", currentAppointmentId);
    
    const response = await fetch(`${API_URL}/prescriptions/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        appointmentId: currentAppointmentId,
        diagnosis,
        medicines,
        notes
      })
    });

    const data = await response.json();
    console.log("📥 Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to create prescription");
    }

    showStatus("✅ Prescription created successfully! Patient can view it on their dashboard.", "success", prescriptionStatus);
    
    // Clear inputs after successful save
    setTimeout(() => {
      clearPrescription();
    }, 1500);

  } catch (error) {
    console.error("❌ Error creating prescription:", error);
    showStatus(`Error: ${error.message}`, "danger", prescriptionStatus);
  }
}

/**
 * Display appointment status and control buttons
 */
function displayAppointmentStatus() {
  const statusSection = document.getElementById("statusSection");
  const status = currentAppointment.status || 'pending';
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  
  let statusHTML = `
    <div class="mb-3">
      <label class="form-label fw-bold">Current Status:</label>
      <div class="alert alert-info border-0 mb-3">
        <i class="fas fa-info-circle"></i> Status: <strong>${statusText}</strong>
      </div>
    </div>
  `;
  
  // Status action buttons
  if (status === 'pending') {
    statusHTML += `
      <div class="d-flex gap-2 flex-wrap">
        <button type="button" class="btn btn-success flex-grow-1" onclick="updateStatus('accepted')">
          <i class="fas fa-check"></i> Accept Appointment
        </button>
        <button type="button" class="btn btn-danger flex-grow-1" onclick="updateStatus('rejected')">
          <i class="fas fa-times"></i> Reject Appointment
        </button>
      </div>
    `;
  } else if (status === 'accepted') {
    statusHTML += `
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-warning w-100" onclick="updateStatus('completed')">
          <i class="fas fa-check"></i> Mark as Completed
        </button>
      </div>
    `;
  } else if (status === 'completed') {
    statusHTML += `
      <div class="alert alert-success border-0">
        <i class="fas fa-check-circle"></i> This appointment has been completed.
      </div>
    `;
  } else if (status === 'rejected') {
    statusHTML += `
      <div class="alert alert-danger border-0">
        <i class="fas fa-times-circle"></i> This appointment has been rejected.
      </div>
    `;
  }
  
  statusSection.innerHTML = statusHTML;
}

/**
 * Update appointment status
 */
async function updateStatus(newStatus) {
  const token = localStorage.getItem("token");
  
  if (!currentAppointmentId) {
    alert("Appointment ID not found");
    return;
  }

  try {
    console.log(`📤 Updating appointment status to: ${newStatus}`);
    
    const response = await fetch(`${API_URL}/appointments/${currentAppointmentId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    console.log("📥 Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to update appointment status");
    }

    console.log(`✅ Appointment status updated to: ${newStatus}`);
    
    // Update current appointment status
    currentAppointment.status = newStatus;
    
    // Refresh status display
    displayAppointmentStatus();
    
    // Show success message
    const statusSection = document.getElementById("statusSection");
    showStatus(`✅ Appointment marked as ${newStatus}!`, "success", statusSection);

  } catch (error) {
    console.error("❌ Error updating appointment status:", error);
    const statusSection = document.getElementById("statusSection");
    showStatus(`Error: ${error.message}`, "danger", statusSection);
  }
}
