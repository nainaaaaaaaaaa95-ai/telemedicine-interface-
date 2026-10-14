const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", initializeDoctorDashboard);

async function initializeDoctorDashboard() {
  console.log("📊 Initializing doctor dashboard...");
  
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    window.location.href = "/html/login.html";
    return;
  }

  // Load both doctor profile and appointments
  await loadDoctorProfile(token);
  await loadDoctorAppointments(token);
  await loadAllAppointments(token);
}

/**
 * Fetch and display doctor profile details
 */
async function loadDoctorProfile(token) {
  try {
    console.log("🔍 Fetching doctor profile...");
    
    const response = await fetch(`${API_URL}/doctors/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn("Could not fetch doctor profile");
      return;
    }

    const data = await response.json();
    const doctor = data.doctor || data;
    
    console.log("✅ Loaded doctor profile:", doctor);
    displayDoctorProfile(doctor);
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
  }
}

/**
 * Display doctor details in the dashboard
 */
function displayDoctorProfile(doctor) {
  // Update navbar with doctor name and specialization
  document.getElementById("doctorNavName").textContent = "Dr. " + (doctor.name || "Doctor");
  document.getElementById("doctorNavSpecialization").textContent = (doctor.specialization || "Specialist");
}

async function loadDoctorAppointments(token) {
  try {
    console.log("🔍 Fetching doctor appointments...");
    
    const response = await fetch(`${API_URL}/doctors/appointments`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn("Could not fetch appointments from backend");
      loadDoctorDashboardFromLocalStorage();
      return;
    }

    const data = await response.json();
    const appointments = data.appointments || data || [];
    
    console.log("✅ Loaded", appointments.length, "appointments");
    updateDoctorDashboard(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    console.log("Falling back to localStorage");
    loadDoctorDashboardFromLocalStorage();
  }
}

function updateDoctorDashboard(appointments) {
  console.log("💾 Updating dashboard with appointments:", appointments);

  const today = new Date().toISOString().split("T")[0];

  // TODAY'S APPOINTMENTS - Count appointments scheduled for today (not completed, not rejected)
  const todaysAppointments = appointments.filter(app => {
    const appDate = app.date || app.appointmentDate;
    const appStatus = (app.status || "pending").toLowerCase();
    return appDate === today && appStatus !== "rejected" && appStatus !== "completed";
  });

  document.getElementById("todayCount").innerText = todaysAppointments.length || 0;

  // TOTAL PATIENTS (UNIQUE) - Count unique patients from all appointments
  const uniquePatientIds = new Set(appointments.map(app => {
    if (app.patientId && app.patientId._id) return app.patientId._id;
    if (app.patientId) return app.patientId;
    return null;
  }).filter(id => id));

  document.getElementById("totalPatients").innerText = uniquePatientIds.size || 0;

  // PENDING REQUESTS - Count appointments with pending status
  const pending = appointments.filter(app => (app.status || "pending").toLowerCase() === "pending");
  document.getElementById("pendingRequests").innerText = pending.length || 0;

  // COMPLETED TODAY - Count completed appointments for today
  const completedToday = appointments.filter(app => {
    const appDate = app.date || app.appointmentDate;
    const appStatus = (app.status || "pending").toLowerCase();
    return appDate === today && appStatus === "completed";
  });

  document.getElementById("completedToday").innerText = completedToday.length || 0;

  // TODAY'S SCHEDULE TABLE
  const table = document.getElementById("todaySchedule");
  if (table) {
    table.innerHTML = "";

    if (todaysAppointments.length === 0) {
      table.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No appointments today</td></tr>`;
      return;
    }

    todaysAppointments.forEach(app => {
      const patientName = app.patientId?.name || app.patientName || "Patient";
      const patientId = app.patientId?._id || app.patientId || app.patientEmail;
      const time = app.time || "TBD";
      
      table.innerHTML += `
        <tr>
          <td>${patientName}</td>
          <td>${time}</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="viewPatientProfile('${patientId}')">
              View Profile
            </button>
          </td>
          <td>
            <button class="btn btn-success btn-sm" onclick="joinCall('${patientId}')">
              Join Call
            </button>
          </td>
        </tr>
      `;
    });
  }
}

function loadDoctorDashboardFromLocalStorage() {
  console.log("📋 Loading from localStorage (fallback)");
  
  let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  const today = new Date().toISOString().split("T")[0];

  const todaysAppointments = appointments.filter(
    app => app.date === today && app.status === "Scheduled"
  );

  document.getElementById("todayCount").innerText = todaysAppointments.length;

  const uniquePatients = new Set(
    appointments.map(app => app.patientEmail)
  );

  document.getElementById("totalPatients").innerText = uniquePatients.size;

  const pending = appointments.filter(
    app => app.status === "Pending"
  );

  document.getElementById("pendingRequests").innerText = pending.length;

  const table = document.getElementById("todaySchedule");
  if (table) {
    table.innerHTML = "";
    todaysAppointments.forEach(app => {
      table.innerHTML += `
        <tr>
          <td>${app.patientName}</td>
          <td>${app.time}</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="viewPatientProfile('${app.patientId}')">
              View Profile
            </button>
          </td>
          <td>
            <button class="btn btn-success btn-sm" onclick="joinCall('${app.patientId}')">
              Join Call
            </button>
          </td>
        </tr>
      `;
    });
  }
}

function viewPatientProfile(patientId) {
  console.log("👤 Viewing patient profile:", patientId);
  localStorage.setItem("viewPatientId", patientId);
  window.location.href = "/html/profile.html?view=" + patientId;
}

function joinCall(patientId) {
  console.log("📞 Joining call with patient:", patientId);
  localStorage.setItem("activePatientId", patientId);
  window.location.href = "/html/videocall.html";
}

/**
 * Load all booked appointments for the doctor
 */
async function loadAllAppointments(token) {
  try {
    console.log("\n📅 LOADING ALL DOCTOR APPOINTMENTS...");
    
    const endpoint = `${API_URL}/appointments/doctor`;
    console.log("📍 Fetching from:", endpoint);
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Raw response data:", data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch appointments: ${response.status}`);
    }

    let appointments = data.appointments || [];
    console.log(`📈 Total appointments: ${appointments.length}`);
    
    displayAllAppointments(appointments);

  } catch (error) {
    console.error("❌ Error loading appointments:", error);
    const appointmentsContainer = document.getElementById("appointmentsContainer");
    if (appointmentsContainer) {
      appointmentsContainer.innerHTML = `<div class="alert alert-danger">Error loading appointments: ${error.message}</div>`;
    }
  }
}

/**
 * Display all appointments in separate tabs: All Appointments, Meet Link, and Prescription
 */
function displayAllAppointments(appointments) {
  // First update the stat cards with correct calculations
  updateDoctorDashboard(appointments);
  
  const appointmentsContainer = document.getElementById("appointmentsContainer");
  const appointmentsTableContainer = document.getElementById("appointmentsTableContainer");
  const appointmentsList = document.getElementById("appointmentsList");
  
  const meetLinkContainer = document.getElementById("meetLinkContainer");
  const meetLinkTableContainer = document.getElementById("meetLinkTableContainer");
  const meetLinkList = document.getElementById("meetLinkList");
  
  const prescriptionContainer = document.getElementById("prescriptionContainer");
  const prescriptionTableContainer = document.getElementById("prescriptionTableContainer");
  const prescriptionList = document.getElementById("prescriptionList");
  
  if (!appointmentsList || !meetLinkList || !prescriptionList) {
    console.error("❌ One or more list elements not found");
    return;
  }

  if (appointments.length === 0) {
    console.log("ℹ️ No appointments found");
    appointmentsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-check"></i>
        <p>No booked appointments yet</p>
      </div>
    `;
    meetLinkContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-video"></i>
        <p>No appointments to add meet links</p>
      </div>
    `;
    prescriptionContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-prescription-bottle"></i>
        <p>No appointments for prescriptions</p>
      </div>
    `;
    appointmentsTableContainer.style.display = 'none';
    meetLinkTableContainer.style.display = 'none';
    prescriptionTableContainer.style.display = 'none';
    return;
  }

  // Sort by date
  appointments.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filter out completed and rejected appointments (they stay in DB but hidden from display)
  const activeAppointments = appointments.filter(apt => {
    const status = (apt.status || "pending").toLowerCase();
    return status !== "completed" && status !== "rejected";
  });

  console.log(`📊 Active appointments: ${activeAppointments.length} (out of ${appointments.length} total)`);

  // Show tables and clear lists
  appointmentsContainer.innerHTML = '';
  meetLinkContainer.innerHTML = '';
  prescriptionContainer.innerHTML = '';
  appointmentsTableContainer.style.display = 'block';
  meetLinkTableContainer.style.display = 'block';
  prescriptionTableContainer.style.display = 'block';
  appointmentsList.innerHTML = '';
  meetLinkList.innerHTML = '';
  prescriptionList.innerHTML = '';

  if (activeAppointments.length === 0) {
    console.log("ℹ️ No active appointments found");
    appointmentsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-check"></i>
        <p>No active appointments</p>
      </div>
    `;
    meetLinkContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-video"></i>
        <p>No appointments to add meet links</p>
      </div>
    `;
    prescriptionContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-prescription-bottle"></i>
        <p>No appointments for prescriptions</p>
      </div>
    `;
    appointmentsTableContainer.style.display = 'none';
    meetLinkTableContainer.style.display = 'none';
    prescriptionTableContainer.style.display = 'none';
    return;
  }

  activeAppointments.forEach((apt, idx) => {
    console.log(`  Processing appointment ${idx + 1}:`, apt);
    
    // Get patient name
    let patientName = 'Unknown Patient';
    let patientId = apt.patientId;
    if (apt.patientId) {
      if (typeof apt.patientId === 'object' && apt.patientId.name) {
        patientName = apt.patientId.name;
        patientId = apt.patientId._id;
      }
    }
    
    // Format date and time
    const dateObj = new Date(apt.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const dateTimeStr = `${formattedDate} at ${apt.time || '--:--'}`;
    
    // Get status badge
    const statusBadgeClass = getStatusBadgeClass(apt.status);
    const statusText = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
    
    // ===== TAB 1: ALL APPOINTMENTS =====
    const appointmentRow = document.createElement("tr");
    
    // Dynamic action buttons based on appointment status
    let actionsHTML = `
      <div class="d-flex gap-1 flex-wrap">
        <button class="btn btn-info btn-sm" onclick="viewPatientDetails('${apt._id}')">
          <i class="fas fa-user"></i> Details
        </button>
        <button class="btn btn-primary btn-sm" onclick="viewPatientProfile('${patientId}')">
          <i class="fas fa-file-user"></i> Profile
        </button>
    `;
    
    // Add confirm button if appointment is pending
    if ((apt.status || "pending").toLowerCase() === "pending") {
      actionsHTML += `
        <button class="btn btn-success btn-sm" onclick="confirmAppointment('${apt._id}')">
          <i class="fas fa-check"></i> Confirm
        </button>
      `;
    }
    
    // Add mark complete button if appointment is accepted
    if ((apt.status || "pending").toLowerCase() === "accepted") {
      actionsHTML += `
        <button class="btn btn-warning btn-sm" onclick="completeAppointment('${apt._id}')">
          <i class="fas fa-flag-checkered"></i> Mark Complete
        </button>
      `;
    }
    
    actionsHTML += `</div>`;
    
    appointmentRow.innerHTML = `
      <td><strong>${patientName}</strong></td>
      <td>${dateTimeStr}</td>
      <td>${apt.reason || '-'}</td>
      <td><span class="status-badge status-${apt.status.toLowerCase()}">${statusText}</span></td>
      <td>${actionsHTML}</td>
    `;
    
    appointmentsList.appendChild(appointmentRow);
    
    // ===== TAB 2: MEET LINK =====
    const meetRow = document.createElement("tr");
    let meetLinkHTML = '';
    let meetActionsHTML = '';
    
    if (apt.meetLink) {
      meetLinkHTML = `
        <a href="${apt.meetLink}" target="_blank" class="btn btn-primary btn-sm w-100">
          <i class="fas fa-video"></i> ${apt.meetLink}
        </a>
      `;
      meetActionsHTML = `
        <button class="btn btn-warning btn-sm w-100" onclick="openMeetLinkModal('${apt._id}')">
          <i class="fas fa-edit"></i> Edit Link
        </button>
      `;
    } else {
      meetLinkHTML = '<span class="text-muted">No link added</span>';
      meetActionsHTML = `
        <button class="btn btn-outline-info btn-sm w-100" onclick="openMeetLinkModal('${apt._id}')">
          <i class="fas fa-plus"></i> Add Link
        </button>
      `;
    }
    
    meetRow.innerHTML = `
      <td><strong>${patientName}</strong></td>
      <td>${dateTimeStr}</td>
      <td>${meetLinkHTML}</td>
      <td>${meetActionsHTML}</td>
    `;
    
    meetLinkList.appendChild(meetRow);
    
    // ===== TAB 3: PRESCRIPTION =====
    const prescriptionRow = document.createElement("tr");
    let prescriptionHTML = '';
    let prescriptionActionsHTML = '';
    
    if (apt.prescriptionId) {
      prescriptionHTML = `
        <button class="btn btn-success btn-sm w-100" onclick="viewPrescription('${apt.prescriptionId}')">
          <i class="fas fa-check"></i> View Rx
        </button>
      `;
      prescriptionActionsHTML = `
        <button class="btn btn-info btn-sm w-100" onclick="openPrescriptionModal('${apt._id}', '${patientName}')">
          <i class="fas fa-edit"></i> Edit Rx
        </button>
      `;
    } else if (apt.status === 'completed') {
      prescriptionHTML = `
        <div class="text-center">
          <small class="text-success"><i class="fas fa-times-circle"></i> Not Created</small>
        </div>
      `;
      prescriptionActionsHTML = '';
    } else {
      prescriptionHTML = '<span class="text-muted">Pending</span>';
      prescriptionActionsHTML = `
        <button class="btn btn-outline-success btn-sm w-100" onclick="openPrescriptionModal('${apt._id}', '${patientName}')">
          <i class="fas fa-plus"></i> Create Rx
        </button>
      `;
    }
    
    prescriptionRow.innerHTML = `
      <td><strong>${patientName}</strong></td>
      <td>${dateTimeStr}</td>
      <td><span class="status-badge status-${apt.status.toLowerCase()}">${statusText}</span></td>
      <td>${prescriptionHTML}</td>
      <td>${prescriptionActionsHTML}</td>
    `;
    
    prescriptionList.appendChild(prescriptionRow);
    console.log(`  ✅ Added rows for: ${patientName}`);
  });
  
  console.log(`✅ Successfully displayed ${appointments.length} appointments in all tabs\n`);
}

/**
 * Get status badge CSS class
 */
function getStatusBadgeClass(status) {
  const statusMap = {
    'pending': 'bg-warning text-dark',
    'accepted': 'bg-success text-white',
    'rejected': 'bg-danger text-white',
    'completed': 'bg-info text-white'
  };
  
  return statusMap[status?.toLowerCase()] || 'bg-light text-dark';
}

/**
 * Open meet link modal
 */
function openMeetLinkModal(appointmentId) {
  console.log("📞 Opening meet link modal for appointment:", appointmentId);
  document.getElementById("appointmentId").value = appointmentId;
  document.getElementById("meetLinkInput").value = '';
  new bootstrap.Modal(document.getElementById("meetLinkModal")).show();
}

/**
 * Save meet link
 */
async function saveMeetLink() {
  try {
    const appointmentId = document.getElementById("appointmentId").value;
    const meetLink = document.getElementById("meetLinkInput").value;
    const token = localStorage.getItem("token");

    if (!meetLink) {
      alert("Please enter a valid Google Meet link");
      return;
    }

    console.log("📤 Saving meet link for appointment:", appointmentId);
    
    const response = await fetch(`${API_URL}/appointments/${appointmentId}/meetlink`, {
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

    alert("✅ Google Meet link added successfully!");
    bootstrap.Modal.getInstance(document.getElementById("meetLinkModal")).hide();
    
    // Reload appointments
    await loadAllAppointments(token);

  } catch (error) {
    console.error("❌ Error saving meet link:", error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Open prescription modal
 */
function openPrescriptionModal(appointmentId, patientName = '') {
  console.log("💊 Opening prescription modal for appointment:", appointmentId);
  document.getElementById("prescriptionAppointmentId").value = appointmentId;
  document.getElementById("prescriptionPatientName").textContent = patientName || 'Patient';
  document.getElementById("diagnosisInput").value = '';
  document.getElementById("medicinesInput").value = '';
  document.getElementById("notesInput").value = '';
  new bootstrap.Modal(document.getElementById("prescriptionModal")).show();
}

/**
 * View prescription details - fetches from backend
 */
async function viewPrescription(prescriptionId) {
  try {
    const token = localStorage.getItem("token");
    
    console.log("📖 Fetching prescription:", prescriptionId);
    
    const response = await fetch(`${API_URL}/prescriptions/${prescriptionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("📥 Prescription data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch prescription");
    }

    const prescription = data;
    
    // Display prescription details in the view modal
    document.getElementById("viewDiagnosis").textContent = prescription.diagnosis || '-';
    document.getElementById("viewMedicines").textContent = prescription.medicines || '-';
    document.getElementById("viewNotes").textContent = prescription.notes || 'No additional instructions';
    
    new bootstrap.Modal(document.getElementById("viewPrescriptionModal")).show();

  } catch (error) {
    console.error("❌ Error viewing prescription:", error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Save prescription and mark appointment as completed
 */
async function savePrescription() {
  try {
    const appointmentId = document.getElementById("prescriptionAppointmentId").value;
    const diagnosis = document.getElementById("diagnosisInput").value;
    const medicines = document.getElementById("medicinesInput").value;
    const notes = document.getElementById("notesInput").value;
    const token = localStorage.getItem("token");

    if (!diagnosis || !medicines) {
      alert("❌ Please fill in diagnosis and medicines");
      return;
    }

    console.log("📤 Creating prescription for appointment:", appointmentId);
    
    const response = await fetch(`${API_URL}/prescriptions/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        appointmentId,
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

    // Show the created prescription in the view modal
    document.getElementById("viewDiagnosis").textContent = diagnosis;
    document.getElementById("viewMedicines").textContent = medicines;
    document.getElementById("viewNotes").textContent = notes || "No additional instructions";

    // Close create modal and show view modal
    bootstrap.Modal.getInstance(document.getElementById("prescriptionModal")).hide();
    
    setTimeout(() => {
      new bootstrap.Modal(document.getElementById("viewPrescriptionModal")).show();
    }, 300);

    // Update appointment status to completed
    await updateAppointmentStatus(appointmentId, 'completed');

  } catch (error) {
    console.error("❌ Error creating prescription:", error);
    alert(`❌ Error: ${error.message}`);
  }
}

/**
 * Confirm appointment (change status from pending to accepted)
 */
async function confirmAppointment(appointmentId) {
  try {
    const confirmed = confirm("Are you sure you want to confirm this appointment?");
    if (!confirmed) return;

    console.log(`✅ Confirming appointment ${appointmentId}...`);
    await updateAppointmentStatus(appointmentId, 'accepted');
    alert("✅ Appointment confirmed successfully!");
  } catch (error) {
    console.error("❌ Error confirming appointment:", error);
    alert(`❌ Error: ${error.message}`);
  }
}

/**
 * Mark appointment as complete
 */
async function completeAppointment(appointmentId) {
  try {
    const confirmed = confirm("Are you sure you want to mark this appointment as completed?");
    if (!confirmed) return;

    console.log(`✅ Completing appointment ${appointmentId}...`);
    await updateAppointmentStatus(appointmentId, 'completed');
    alert("✅ Appointment marked as completed!");
  } catch (error) {
    console.error("❌ Error completing appointment:", error);
    alert(`❌ Error: ${error.message}`);
  }
}

/**
 * Update appointment status
 */
async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    const token = localStorage.getItem("token");

    console.log(`📤 Updating appointment ${appointmentId} to status: ${newStatus}`);
    
    const response = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
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
      throw new Error(data.message || "Failed to update appointment");
    }

    console.log(`✅ Appointment status updated to: ${newStatus}`);
    
    // Reload appointments
    await loadAllAppointments(token);

  } catch (error) {
    console.error("❌ Error updating appointment status:", error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * View patient details page
 */
function viewPatientDetails(appointmentId) {
  console.log("👤 Navigating to patient details for appointment:", appointmentId);
  window.location.href = `/html/patientdetails.html?appointmentId=${appointmentId}`;
}

/**
 * View patient profile (existing function)
 */
function viewPatientProfile(patientId) {
  console.log("👤 Viewing patient profile:", patientId);
  localStorage.setItem("viewPatientId", patientId);
  window.location.href = "/html/profile.html?view=" + patientId;
}
