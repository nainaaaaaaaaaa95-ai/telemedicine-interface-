const API_URL = "http://localhost:5000/api";
let currentPrescription = {};

document.addEventListener("DOMContentLoaded", loadPrescriptionDetails);

/**
 * Load prescription details from URL parameter
 */
async function loadPrescriptionDetails() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const prescriptionId = urlParams.get("id");
    const token = localStorage.getItem("token");

    if (!prescriptionId) {
      alert("No prescription ID provided");
      window.location.href = "/html/patientdash.html";
      return;
    }

    console.log("Loading prescription:", prescriptionId);

    const response = await fetch(`${API_URL}/prescriptions/${prescriptionId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load prescription");
    }

    currentPrescription = await response.json();
    console.log("Loaded prescription:", currentPrescription);
    displayPrescription(currentPrescription);

  } catch (error) {
    console.error("Error loading prescription:", error);
    alert("Error loading prescription: " + error.message);
  }
}

/**
 * Display prescription details on the page
 */
function displayPrescription(prescription) {
  // Display doctor name
  const doctorName = prescription.doctorId?.name || prescription.doctorName || "Unknown Doctor";
  document.getElementById("doctorName").textContent = doctorName;

  // Display date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById("prescDate").textContent = currentDate;

  // Display medicines
  const medicineList = document.getElementById("medicineList");
  if (prescription.medicines) {
    medicineList.innerHTML = prescription.medicines
      .split('\n')
      .filter(line => line.trim())
      .map(medicine => `<li>${medicine.trim()}</li>`)
      .join('');
  } else {
    medicineList.innerHTML = '<li>No medicines prescribed</li>';
  }

  // Display doctor notes
  const doctorNotes = document.getElementById("doctorNotes");
  doctorNotes.textContent = prescription.notes || "No additional notes";
}
