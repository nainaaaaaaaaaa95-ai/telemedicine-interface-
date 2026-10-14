document.addEventListener("DOMContentLoaded", loadToday);

function loadToday() {
  const table = document.getElementById("todayTable");
  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  const today = new Date().toISOString().split("T")[0];

  const todayApps = appointments.filter(app =>
    app.date === today && app.status === "Scheduled"
  );

  table.innerHTML = "";

  if (todayApps.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          No appointments today
        </td>
      </tr>`;
    return;
  }

  todayApps.forEach((app, index) => {
    table.innerHTML += `
      <tr>
        <td>${app.patientName}</td>
        <td>${app.time}</td>
        <td>
          <span class="badge bg-success">${app.status}</span>
        </td>
        <td>
          <button class="btn btn-primary btn-sm"
                  onclick="startCall(${index})">
            Start Call
          </button>
        </td>
      </tr>`;
  });
}

function startCall(index) {
  localStorage.setItem("activeAppointment", index);
  window.location.href = "videocall.html";
}
