document.addEventListener("DOMContentLoaded", loadPatients);

function loadPatients() {
  const table = document.getElementById("patientTable");
  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];

  const patients = {};

  appointments.forEach(app => {
    if (!patients[app.patientName]) {
      patients[app.patientName] = {
        count: 0,
        lastVisit: app.date
      };
    }

    patients[app.patientName].count++;

    if (new Date(app.date) > new Date(patients[app.patientName].lastVisit)) {
      patients[app.patientName].lastVisit = app.date;
    }
  });

  table.innerHTML = "";

  Object.keys(patients).forEach(name => {
    table.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${patients[name].count}</td>
        <td>${new Date(patients[name].lastVisit).toDateString()}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm"
                  onclick="viewHistory('${name}')">
            View History
          </button>
        </td>
      </tr>
    `;
  });
}

function viewHistory(name) {
  localStorage.setItem("selectedPatient", name);
  window.location.href = "patienthistory.html";
}
