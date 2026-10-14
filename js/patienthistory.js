document.addEventListener("DOMContentLoaded", loadHistory);

function loadHistory() {
  const name = localStorage.getItem("selectedPatient");
  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];

  document.getElementById("patientName").innerText = `Patient: ${name}`;

  const history = appointments.filter(app => app.patientName === name);
  const table = document.getElementById("historyTable");
  table.innerHTML = "";

  history.forEach(app => {
    table.innerHTML += `
      <tr>
        <td>${new Date(app.date).toDateString()}</td>
        <td>${app.doctor}</td>
        <td>${app.status}</td>
        <td>${app.prescription || "-"}</td>
      </tr>
    `;
  });
}
