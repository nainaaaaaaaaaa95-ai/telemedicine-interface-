// API Configuration
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  console.log("📊 Patient Dashboard loaded");
  
  // Check authentication
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (!token || !user.email) {
    console.error("Not authenticated, redirecting to login");
    window.location.href = "/html/login.html";
    return;
  }
  
  console.log("✅ Authenticated user:", user.email);
  loadAppointmentsAndPrescriptions();
  
  // Auto-refresh appointments and prescriptions every 10 seconds to show new prescriptions
  setInterval(() => {
    console.log("🔄 Auto-refreshing appointments and prescriptions...");
    loadAppointmentsAndPrescriptions();
  }, 10000);
});

/**
 * Load appointments and prescriptions
 */
async function loadAppointmentsAndPrescriptions() {
  try {
    await loadPrescriptions();
    await loadAppointments();
  } catch (error) {
    console.error("Error in loadAppointmentsAndPrescriptions:", error);
  }
}

/**
 * Load prescriptions from backend API
 */
async function loadPrescriptions() {
  try {
    console.log("📋 Loading prescriptions...");
    
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_URL}/prescriptions/my`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.warn("Could not load prescriptions, status:", response.status);
      window.prescriptionMap = {};
      return;
    }

    const data = await response.json();
    console.log("✅ Raw prescription response:", data);
    
    // Handle both direct array and nested format
    let prescriptions = Array.isArray(data) ? data : (data.prescriptions || []);
    console.log("📈 Total prescriptions received:", prescriptions.length);
    
    // Store prescriptions in a map for easy lookup by appointmentId
    window.prescriptionMap = {};
    prescriptions.forEach((p, idx) => {
      const apptId = p.appointmentId?._id || p.appointmentId;
      if (apptId) {
        window.prescriptionMap[apptId] = p;
        console.log(`  [${idx + 1}] Mapped prescription for appointment ${apptId}:`, {
          prescriptionId: p._id,
          diagnosis: p.diagnosis,
          medicines: p.medicines ? p.medicines.substring(0, 50) : 'N/A'
        });
      } else {
        console.warn(`  [${idx + 1}] Prescription has no appointmentId:`, p);
      }
    });
    
    console.log("✅ Final prescription map:", Object.keys(window.prescriptionMap).length, "prescriptions mapped");

  } catch (error) {
    console.error("Error loading prescriptions:", error);
    window.prescriptionMap = {};
  }
}

/**
 * Load upcoming appointments from backend API
 */
async function loadAppointments() {
  try {
    console.log("\n📅 LOADING DASHBOARD APPOINTMENTS...");
    
    const token = localStorage.getItem("token");
    const table = document.getElementById("appointmentTable");
    
    if (!table) {
      console.error("❌ Appointment table not found");
      return;
    }

    const endpoint = `${API_URL}/appointments/my`;
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

    // Handle both direct array and nested appointments
    let appointments = [];
    if (Array.isArray(data)) {
      appointments = data;
      console.log("✅ Response format: Direct array");
    } else if (data.appointments && Array.isArray(data.appointments)) {
      appointments = data.appointments;
      console.log("✅ Response format: Nested in 'appointments' property");
    } else {
      console.warn("⚠️ Unknown response format. Keys:", Object.keys(data));
      appointments = [];
    }
    
    console.log(`📈 Total appointments received: ${appointments.length}`);
    
    // Filter only upcoming appointments (future dates) and exclude completed/rejected
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const status = (apt.status || "pending").toLowerCase();
      // Show only future/today appointments that are not completed or rejected
      return aptDate >= today && status !== "completed" && status !== "rejected";
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`🎯 Upcoming appointments: ${upcomingAppointments.length}`);
    
    table.innerHTML = "";

    if (upcomingAppointments.length === 0) {
      console.log("ℹ️ No upcoming appointments");
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">
            No upcoming appointments. <a href="appoinment.html">Book one now!</a>
          </td>
        </tr>`;
      return;
    }

    // Display appointments
    upcomingAppointments.forEach((apt, idx) => {
      console.log(`  Processing appointment ${idx + 1}:`, apt);
      
      // Get doctor name
      let doctorName = 'Unknown Doctor';
      if (apt.doctorId) {
        if (typeof apt.doctorId === 'object' && apt.doctorId.name) {
          doctorName = apt.doctorId.name;
        } else if (typeof apt.doctorId === 'string') {
          doctorName = 'Dr. ' + apt.doctorId.substring(0, 8);
        }
      }
      
      // Format date
      const dateObj = new Date(apt.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      // Get status badge color
      const statusBadgeClass = getStatusBadgeClass(apt.status);
      const statusText = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
      
      // Get meet link or show message - improved display
      let meetLinkHTML = '-';
      if (apt.meetLink) {
        // Show the actual meet link button
        meetLinkHTML = `
          <a href="${apt.meetLink}" target="_blank" class="btn btn-sm btn-success" style="font-weight: 600;">
            <i class="fas fa-video"></i> Join Meeting
          </a>
        `;
      } else if ((apt.status === 'accepted' || apt.status === 'completed' || apt.status === 'pending') && apt.status === 'accepted') {
        // Only show "Waiting for link" if appointment is accepted but no link yet
        meetLinkHTML = '<span class="text-muted" style="font-size: 0.9rem;"><i class="fas fa-clock"></i> Waiting for link</span>';
      } else if (apt.status === 'pending') {
        // For pending appointments, show it's still pending
        meetLinkHTML = '<span class="text-warning" style="font-size: 0.9rem;"><i class="fas fa-hourglass-half"></i> Pending confirmation</span>';
      } else if (apt.status === 'rejected') {
        meetLinkHTML = '<span class="text-danger" style="font-size: 0.9rem;"><i class="fas fa-times-circle"></i> Appointment rejected</span>';
      } else if (apt.status === 'completed') {
        meetLinkHTML = '<span class="text-success" style="font-size: 0.9rem;"><i class="fas fa-check-circle"></i> Completed</span>';
      }
      
      // Get prescription display
      let prescriptionHTML = '-';
      const prescription = window.prescriptionMap && window.prescriptionMap[apt._id];
      
      console.log(`  Prescription lookup for appointment ${apt._id}:`, {
        found: !!prescription,
        prescriptionMap: Object.keys(window.prescriptionMap || {})
      });
      
      if (prescription) {
        console.log(`    ✅ Found prescription:`, prescription._id);
        prescriptionHTML = `
          <button class="btn btn-sm btn-success" onclick="viewPrescription('${prescription._id}', '${apt.doctorId?.name || 'Doctor'}')">
            <i class="fas fa-file-medical"></i> View Rx
          </button>
        `;
      } else if (apt.status === 'completed') {
        console.log(`    ❌ No prescription for completed appointment`);
        prescriptionHTML = '<span class="text-muted text-sm"><i class="fas fa-clock"></i> No prescription yet</span>';
      } else {
        console.log(`    ⏳ Appointment not yet completed`);
        prescriptionHTML = '<span class="text-warning text-sm"><i class="fas fa-hourglass-half"></i> Pending</span>';
      }
      
      const row = `
        <tr>
          <td>
            <div class="doctor-badge">
              <i class="fas fa-user-md"></i>
              <strong>${doctorName}</strong>
            </div>
          </td>
          <td>${formattedDate} at ${apt.time || '-'}</td>
          <td><span class="status-badge status-${apt.status.toLowerCase()}">${statusText}</span></td>
          <td>${meetLinkHTML}</td>
          <td>${prescriptionHTML}</td>
        </tr>`;
      
      table.innerHTML += row;
      console.log(`  ✅ Added row for: ${doctorName}`);
    });
    
    console.log(`✅ Successfully displayed ${upcomingAppointments.length} appointments\n`);

  } catch (error) {
    console.error("❌ Error loading appointments:", error);
    
    const table = document.getElementById("appointmentTable");
    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-danger text-center">
            Error loading appointments: ${error.message}
          </td>
        </tr>`;
    }
  }
}

/**
 * Get status badge CSS class based on appointment status
 */
function getStatusBadgeClass(status) {
  const statusMap = {
    'pending': 'bg-warning text-dark',
    'accepted': 'bg-success text-white',
    'rejected': 'bg-danger text-white',
    'completed': 'bg-info text-white',
    'cancelled': 'bg-secondary text-white'
  };
  
  return statusMap[status?.toLowerCase()] || 'bg-light text-dark';
}

/**
 * View prescription details - fetches from backend
 */
async function viewPrescription(prescriptionId, doctorName) {
  try {
    const token = localStorage.getItem("token");
    
    console.log("📖 Fetching prescription:", prescriptionId);
    console.log("  Doctor:", doctorName);
    
    const response = await fetch(`${API_URL}/prescriptions/${prescriptionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch prescription: ${response.status}`);
    }

    const prescription = await response.json();
    console.log("✅ Prescription loaded:", {
      id: prescription._id,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines ? prescription.medicines.substring(0, 50) : 'N/A',
      doctor: prescription.doctorId?.name || 'Unknown'
    });
    
    // Display prescription details in the view modal
    const doctorDisplayName = prescription.doctorId?.name || doctorName || 'Unknown Doctor';
    document.getElementById("prescriptionDoctorName").textContent = doctorDisplayName;
    document.getElementById("viewDiagnosis").textContent = prescription.diagnosis || '-';
    document.getElementById("viewMedicines").textContent = prescription.medicines || '-';
    document.getElementById("viewNotes").textContent = prescription.notes || 'No additional instructions';
    
    new bootstrap.Modal(document.getElementById("viewPrescriptionModal")).show();

  } catch (error) {
    console.error("❌ Error viewing prescription:", error);
    alert(`Error loading prescription: ${error.message}`);
  }
}


