// API Configuration
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  console.log("\n\n═══════════════════════════════════════════");
  console.log("🚀 APPOINTMENT PAGE INITIALIZATION");
  console.log("═══════════════════════════════════════════");
  
  // Verify authentication
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  console.log("✅ Token exists:", !!token);
  console.log("✅ User data:", user);
  
  if (!token || !user.email) {
    console.error("❌ Not authenticated, redirecting to login");
    window.location.href = "/html/login.html";
    return;
  }

  // Get form and attach event listener
  const bookingForm = document.getElementById("bookForm");
  if (bookingForm) {
    console.log("✅ Booking form found");
    bookingForm.addEventListener("submit", handleBooking);
  } else {
    console.error("❌ Booking form not found");
  }

  // Initialize functions
  console.log("📍 Initializing page functions...");
  
  console.log("  1️⃣  Loading doctors...");
  loadDoctors();
  
  console.log("  2️⃣  Loading upcoming appointments...");
  loadUpcomingAppointments();
  
  console.log("  3️⃣  Setting minimum date...");
  setMinimumDate();
  
  console.log("═══════════════════════════════════════════");
  console.log("✅ PAGE INITIALIZATION COMPLETE");
  console.log("═══════════════════════════════════════════\n");
});

/**
 * Load doctors from backend and populate dropdown
 */
async function loadDoctors() {
  try {
    console.log("\n📋 ========== LOADING DOCTORS ==========");
    
    const token = localStorage.getItem("token");
    const doctorSelect = document.getElementById("doctor");
    
    if (!doctorSelect) {
      console.error("❌ Doctor select element not found");
      return;
    }

    const endpoint = `${API_URL}/doctors/list`;
    console.log("📍 API Endpoint:", endpoint);
    console.log("🔐 Token valid:", !!token);
    
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
      throw new Error(data.message || `Failed to fetch doctors: ${response.status}`);
    }

    // Handle different response formats
    let doctors = [];
    if (Array.isArray(data)) {
      console.log("✅ Response format: Direct array");
      doctors = data;
    } else if (data.doctors && Array.isArray(data.doctors)) {
      console.log("✅ Response format: Nested in 'doctors' property");
      doctors = data.doctors;
    } else {
      console.warn("⚠️ Unknown response format. Keys:", Object.keys(data));
      throw new Error("Invalid response format");
    }

    console.log(`📈 Total doctors retrieved: ${doctors.length}`);
    console.log("📋 Doctors data:", doctors);

    // Clear existing options (except placeholder)
    while (doctorSelect.options.length > 1) {
      doctorSelect.remove(1);
    }

    // Add doctors to dropdown
    if (doctors.length === 0) {
      console.warn("⚠️ No doctors found in response");
      useFallbackDoctors();
      return;
    }

    doctors.forEach((doctor, idx) => {
      console.log(`  Adding doctor ${idx + 1}: ${doctor.name} (${doctor._id || doctor.id})`);
      
      const option = document.createElement("option");
      option.value = doctor._id || doctor.id;
      // Display format: dr.name, specialization
      const displayName = `dr.${doctor.name}${doctor.specialization ? `, ${doctor.specialization}` : ''}`;
      option.textContent = displayName;
      doctorSelect.appendChild(option);
      
      console.log(`    ✅ Added option: ${displayName}`);
    });

    console.log(`✅ Successfully loaded ${doctors.length} doctors into dropdown`);
    console.log("📋 ========== DOCTORS LOADED ==========\n");

  } catch (error) {
    console.error("\n❌ ========== LOAD DOCTORS ERROR ==========");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("========================================\n");
    
    // Fallback to sample doctors
    console.log("🚀 Attempting to use fallback doctors...");
    useFallbackDoctors();
  }
}

/**
 * Load upcoming appointments for the patient
 */
async function loadUpcomingAppointments() {
  try {
    console.log("\n📅 ========== LOADING APPOINTMENTS ==========");
    
    const token = localStorage.getItem("token");
    const appointmentsContainer = document.getElementById("appointmentsContainer");
    const appointmentsTable = document.getElementById("appointmentsTable");
    const appointmentsList = document.getElementById("appointmentsList");
    
    if (!appointmentsList) {
      console.error("❌ Appointments list element not found");
      return;
    }

    const endpoint = `${API_URL}/appointments/my`;
    console.log("📍 API Endpoint:", endpoint);
    
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
    console.log("📋 All appointments:", appointments);
    
    // Filter only upcoming appointments (future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const isUpcoming = aptDate >= today;
      console.log(`  Smart date check: ${apt.date} is upcoming = ${isUpcoming}`);
      return isUpcoming;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`🎯 Upcoming appointments after filtering: ${upcomingAppointments.length}`);
    
    if (upcomingAppointments.length === 0) {
      console.log("ℹ️ No upcoming appointments found");
      appointmentsContainer.innerHTML = '<p class="text-muted text-center mt-3">No upcoming appointments. Book one now!</p>';
      appointmentsTable.style.display = 'none';
      console.log("📋 ========== NO APPOINTMENTS ==========\n");
      return;
    }

    // Show table and populate with appointments
    console.log("✅ Displaying appointments table");
    appointmentsContainer.innerHTML = '';
    appointmentsTable.style.display = 'table';
    appointmentsList.innerHTML = '';

    upcomingAppointments.forEach((apt, idx) => {
      console.log(`\n  Processing appointment ${idx + 1}:`);
      console.log(`    Raw data:`, apt);
      
      const row = document.createElement("tr");
      
      // Get doctor name - handle different possible structures
      let doctorName = 'Unknown Doctor';
      if (apt.doctorId) {
        if (typeof apt.doctorId === 'object' && apt.doctorId.name) {
          doctorName = apt.doctorId.name;
          console.log(`    Doctor name (from object): ${doctorName}`);
        } else if (typeof apt.doctorId === 'string') {
          doctorName = 'Dr. ' + apt.doctorId.substring(0, 8);
          console.log(`    Doctor name (from string ID): ${doctorName}`);
        }
      } else if (apt.doctorName) {
        doctorName = apt.doctorName;
        console.log(`    Doctor name (from doctorName): ${doctorName}`);
      }
      
      // Format date
      const dateObj = new Date(apt.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      // Get status badge
      const statusBadge = getStatusBadge(apt.status);
      
      // Get meet link or show message
      let meetLinkHTML = '-';
      if (apt.meetLink) {
        meetLinkHTML = `<a href="${apt.meetLink}" target="_blank" class="btn btn-sm btn-primary">Join Meet</a>`;
      } else if (apt.status === 'accepted' || apt.status === 'completed') {
        meetLinkHTML = '<span class="text-muted text-sm">Waiting for link</span>';
      }
      
      row.innerHTML = `
        <td><strong>${doctorName}</strong></td>
        <td>${formattedDate}</td>
        <td>${apt.time || '-'}</td>
        <td>${apt.reason || '-'}</td>
        <td>${statusBadge}</td>
        <td>${meetLinkHTML}</td>
      `;
      
      appointmentsList.appendChild(row);
      console.log(`    ✅ Row added: ${doctorName} at ${formattedDate} ${apt.time}`);
    });
    
    console.log(`\n✅ Successfully displayed ${upcomingAppointments.length} appointments`);
    console.log("📋 ========== APPOINTMENTS LOADED ==========\n");

  } catch (error) {
    console.error("\n❌ ========== LOAD APPOINTMENTS ERROR ==========");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=============================================\n");
    
    const appointmentsContainer = document.getElementById("appointmentsContainer");
    if (appointmentsContainer) {
      appointmentsContainer.innerHTML = `<div class="alert alert-danger">Error loading appointments: ${error.message}</div>`;
    }
  }
}

/**
 * Get status badge with color coding
 */
function getStatusBadge(status) {
  const statusMap = {
    'pending': { text: 'Pending', class: 'bg-warning text-dark' },
    'accepted': { text: 'Accepted', class: 'bg-success text-white' },
    'rejected': { text: 'Rejected', class: 'bg-danger text-white' },
    'completed': { text: 'Completed', class: 'bg-info text-white' },
    'cancelled': { text: 'Cancelled', class: 'bg-secondary text-white' }
  };
  
  const statusInfo = statusMap[status?.toLowerCase()] || { text: status || 'Unknown', class: 'bg-light text-dark' };
  
  return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * Use fallback doctors if API fails
 */
function useFallbackDoctors() {
  console.log("Using fallback sample doctors");
  const doctorSelect = document.getElementById("doctor");
  
  const sampleDoctors = [
    { _id: "60d5ec49f1b2c72b8c8e4a1a", name: "Dr. Smith" },
    { _id: "60d5ec49f1b2c72b8c8e4a1b", name: "Dr. Johnson" },
    { _id: "60d5ec49f1b2c72b8c8e4a1c", name: "Dr. Williams" }
  ];

  while (doctorSelect.options.length > 1) {
    doctorSelect.remove(1);
  }

  sampleDoctors.forEach(doctor => {
    const option = document.createElement("option");
    option.value = doctor._id;
    option.textContent = doctor.name;
    doctorSelect.appendChild(option);
  });
}
/**
 * Handle appointment booking form submission
 */
async function handleBooking(e) {
  e.preventDefault();
  console.log("\n\n═══════════════════════════════════════════");
  console.log("🔵 APPOINTMENT BOOKING STARTED");
  console.log("═══════════════════════════════════════════");
  
  try {
    const token = localStorage.getItem("token");
    const doctorSelect = document.getElementById("doctor");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const reasonInput = document.getElementById("reason");
    
    const doctorId = doctorSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;
    const reason = reasonInput.value || "General Consultation";
    
    console.log("📝 Form data captured:");
    console.log(`  - Doctor ID: ${doctorId}`);
    console.log(`  - Date: ${date}`);
    console.log(`  - Time: ${time}`);
    console.log(`  - Reason: ${reason}`);
    
    if (!doctorId || !date || !time) {
      console.log("⚠️ Missing required fields");
      alert("Please select doctor, date, and time");
      return;
    }
    
    const bookingData = {
      doctorId: doctorId,
      date: date,
      time: time,
      reason: reason
    };
    
    console.log("📤 Sending booking request to:", `${API_URL}/appointments/book`);
    console.log("📦 Request payload:", bookingData);
    
    const response = await fetch(`${API_URL}/appointments/book`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bookingData)
    });
    
    console.log("📊 Response status:", response.status);
    const data = await response.json();
    console.log("📥 Response data:", data);
    
    if (!response.ok) {
      throw new Error(data.message || `Booking failed: ${response.status}`);
    }
    
    console.log("✅ BOOKING SUCCESSFUL!");
    console.log("📊 Booked appointment details:", data);
    
    alert("Appointment booked successfully!");
    
    // Clear form
    console.log("🧹 Clearing form fields...");
    doctorSelect.value = "";
    dateInput.value = "";
    timeInput.value = "";
    reasonInput.value = "";
    
    // Reload appointments
    console.log("🔄 Reloading upcoming appointments...");
    await loadUpcomingAppointments();
    
    console.log("═══════════════════════════════════════════");
    console.log("✅ APPOINTMENT BOOKING COMPLETED");
    console.log("═══════════════════════════════════════════\n");
    
    // Redirect to patient dashboard after successful booking
    setTimeout(() => {
      window.location.href = "/html/patientdash.html";
    }, 1500);
    
  } catch (error) {
    console.error("\n═══════════════════════════════════════════");
    console.error("❌ BOOKING ERROR");
    console.error("═══════════════════════════════════════════");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("═══════════════════════════════════════════\n");
    
    alert(`Booking failed: ${error.message}`);
  }
}

/**
 * Set minimum date to today
 */
function setMinimumDate() {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;
  
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
}
