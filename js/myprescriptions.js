const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", loadAllPrescriptions);

/**
 * Load all prescriptions for the patient
 */
async function loadAllPrescriptions() {
  try {
    console.log("📋 Loading all prescriptions...");
    
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || !user.email) {
      console.error("Not authenticated, redirecting to login");
      window.location.href = "/html/login.html";
      return;
    }

    if (user.role !== "patient") {
      console.error("Access denied - patient role required");
      window.location.href = "/html/patientdash.html";
      return;
    }
    
    const response = await fetch(`${API_URL}/prescriptions/my`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.warn("Could not load prescriptions, status:", response.status);
      return;
    }

    const prescriptions = await response.json();
    console.log("✅ Loaded", prescriptions.length, "prescriptions");
    
    displayPrescriptions(prescriptions);

  } catch (error) {
    console.error("Error loading prescriptions:", error);
    alert("Error loading prescriptions: " + error.message);
  }
}

/**
 * Display prescriptions in the table
 */
function displayPrescriptions(prescriptions) {
  const prescriptionsList = document.getElementById("prescriptionsList");
  const prescriptionsTable = document.getElementById("prescriptionsTable");
  const emptyContainer = document.getElementById("emptyContainer");

  if (!prescriptions || prescriptions.length === 0) {
    // Show empty state
    prescriptionsTable.style.display = "none";
    emptyContainer.style.display = "block";
    console.log("No prescriptions to display");
    return;
  }

  // Hide empty state, show table
  emptyContainer.style.display = "none";
  prescriptionsTable.style.display = "table";

  prescriptionsList.innerHTML = "";

  prescriptions.forEach((prescription, index) => {
    const doctorName = prescription.doctorId?.name || "Unknown Doctor";
    const diagnosis = prescription.diagnosis || "-";
    const date = new Date(prescription.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${doctorName}</strong>
      </td>
      <td>
        <small>${diagnosis.substring(0, 50)}${diagnosis.length > 50 ? '...' : ''}</small>
      </td>
      <td>
        ${date}
      </td>
      <td>
        <button class="btn-view-rx" onclick="viewPrescription('${prescription._id}', '${doctorName}')">
          <i class="fas fa-eye"></i> View Details
        </button>
      </td>
    `;
    prescriptionsList.appendChild(row);
  });

  console.log("✅ Displayed", prescriptions.length, "prescriptions");
}

/**
 * View prescription details - fetches from backend
 */
async function viewPrescription(prescriptionId, doctorName) {
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

    if (!response.ok) {
      throw new Error("Failed to fetch prescription");
    }

    const prescription = await response.json();
    console.log("✅ Prescription loaded:", {
      id: prescription._id,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines ? prescription.medicines.substring(0, 50) : 'N/A'
    });
    
    // Display prescription details in the modal
    const doctorDisplayName = prescription.doctorId?.name || doctorName || 'Unknown Doctor';
    document.getElementById("prescriptionDoctorName").textContent = doctorDisplayName;
    document.getElementById("viewDiagnosis").textContent = prescription.diagnosis || '-';
    document.getElementById("viewMedicines").textContent = prescription.medicines || '-';
    document.getElementById("viewNotes").textContent = prescription.notes || 'No additional instructions';
    
    // Show the modal
    new bootstrap.Modal(document.getElementById("viewPrescriptionModal")).show();

  } catch (error) {
    console.error("❌ Error viewing prescription:", error);
    alert(`Error loading prescription: ${error.message}`);
  }
}
