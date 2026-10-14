// index.js
// JavaScript for Landing Page (Index)

// Ensure page loads completely
document.addEventListener("DOMContentLoaded", function () {

  // Auto-play carousel (Bootstrap)
  const carouselElement = document.querySelector("#healthCarousel");

  if (carouselElement) {
    new bootstrap.Carousel(carouselElement, {
      interval: 3000,   // slide every 3 seconds
      pause: "hover",  // pause on mouse hover
      ride: "carousel"
    });
  }

  // Login button safety check (optional)
  const loginBtn = document.querySelector(".btn-primary");

  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      console.log("Redirecting to login page...");
    });
  }

});
