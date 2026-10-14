document.addEventListener("DOMContentLoaded", loadPendingRequests);

function loadPendingRequests() {

    const table = document.getElementById("pendingTable");

    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    const pending = appointments.filter(
        app => app.status === "Pending"
    );

    table.innerHTML = "";

    if (pending.length === 0) {
        table.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted">
              No pending requests
            </td>
          </tr>`;
        return;
    }

    pending.forEach((app, index) => {

        table.innerHTML += `
          <tr>
            <td>${app.patientName}</td>
            <td>${new Date(app.date).toDateString()}</td>
            <td>${app.time}</td>
            <td>
              <button class="btn btn-success btn-sm"
                onclick="approveRequest(${index})">
                Approve
              </button>
              <button class="btn btn-danger btn-sm ms-1"
                onclick="rejectRequest(${index})">
                Reject
              </button>
            </td>
          </tr>`;
    });
}

function approveRequest(index) {

    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    appointments[index].status = "Scheduled";

    localStorage.setItem("appointments",
        JSON.stringify(appointments));

    loadPendingRequests();
}

function rejectRequest(index) {

    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    appointments[index].status = "Cancelled";

    localStorage.setItem("appointments",
        JSON.stringify(appointments));

    loadPendingRequests();
}
