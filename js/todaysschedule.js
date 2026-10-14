document.addEventListener("DOMContentLoaded", loadTodaySchedule);

function loadTodaySchedule() {

    const table = document.getElementById("scheduleTable");
    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = appointments.filter(app =>
        app.status === "Scheduled" && app.date === today
    );

    table.innerHTML = "";

    if (todayAppointments.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="3" class="text-center text-muted">
              No appointments scheduled for today
            </td>
          </tr>`;
        return;
    }

    todayAppointments.forEach(app => {
        table.innerHTML += `
          <tr>
            <td>${app.patientName}</td>
            <td>${app.time}</td>
            <td>
              <button class="btn btn-success btn-sm"
                onclick="joinCall('${app.patientName}')">
                Join Call
              </button>
            </td>
          </tr>`;
    });
}

function joinCall(patientName) {
    localStorage.setItem("currentCallPatient", patientName);
    window.location.href = "videocall.html";
}
