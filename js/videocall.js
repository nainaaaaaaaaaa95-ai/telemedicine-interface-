const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", loadCall);

async function loadCall() {
  try {
    console.log("📹 Loading video call...");
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      window.location.href = "/html/login.html";
      return;
    }

    // Try to load appointment details
    const appointmentId = localStorage.getItem("activeAppointmentId");
    const appointmentData = localStorage.getItem("activeAppointment");

    if (!appointmentId && !appointmentData) {
      console.log("No active appointment");
      document.getElementById("doctorName").innerText = "No appointment scheduled";
      return;
    }

    // Try from backend first
    if (appointmentId) {
      try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Loaded appointment from backend:", data);
          updateCallDisplay(data.appointment);
          return;
        }
      } catch (e) {
        console.log("Could not load from backend, using localStorage");
      }
    }

    // Fallback to localStorage
    if (appointmentData) {
      try {
        const appointment = JSON.parse(appointmentData);
        updateCallDisplay(appointment);
      } catch (e) {
        console.log("Invalid appointment data:", e);
      }
    }
  } catch (error) {
    console.error("Error loading call:", error);
  }
}

function updateCallDisplay(appointment) {
  console.log("📋 Updating display with:", appointment);
  
  const doctorName = appointment.doctorName || 
                     appointment.doctor || 
                     `Doctor ${appointment.doctorId}` ||
                     "Video Consultation";
  
  const dateTime = appointment.dateTime ||
                   (appointment.date ? `${new Date(appointment.date).toDateString()} - ${appointment.time}` : "");

  document.getElementById("doctorName").innerText = doctorName;
  document.getElementById("appointmentTime").innerText = dateTime;
}

async function startCall() {
  console.log("🎥 Starting video call...");
  
  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    console.log("✅ Camera stream acquired");
    const video = document.getElementById("localVideo");
    video.srcObject = stream;

    // Show notification
    alert("✅ Video call started! You are connected.");
  } catch (error) {
    console.error("❌ Error accessing camera:", error);
    alert("Unable to access camera. Please check permissions.\n\nError: " + error.message);
  }
}

function endCall() {
  console.log("📵 Ending video call...");
  
  const video = document.getElementById("localVideo");
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }

  alert("Video call ended");
  window.location.href = "/html/patientdash.html";
}
