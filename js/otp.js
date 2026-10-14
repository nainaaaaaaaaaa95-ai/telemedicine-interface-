function verifyOTP() {
  const otp = document.getElementById("otp").value;

  // Get role stored during login/signup
  const role = localStorage.getItem("role");

  if (otp === "1234") {
    alert("Login Successful!");

    // Redirect based on role
    if (role === "doctor") {
      window.location.href = "drdash.html";
    } else {
      window.location.href = "patientdash.html";
    }

  } else {
    alert("Invalid OTP. Try 1234");
  }
}
