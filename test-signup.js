// Test signup API
const testUser = {
  name: "John Smith",
  email: "john.smith@example.com",
  password: "password123",
  role: "patient"
};

console.log("🧪 Testing Signup API");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Endpoint: POST http://localhost:5000/api/auth/signup");
console.log("Data:", JSON.stringify(testUser, null, 2));
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

fetch("http://localhost:5000/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testUser)
})
  .then((res) => {
    console.log("Status Code:", res.status);
    return res.json();
  })
  .then((data) => {
    console.log("\n📦 API Response:");
    console.log(JSON.stringify(data, null, 2));

    if (data.token) {
      console.log("\n✅ SUCCESS! User registered and authenticated!");
      console.log("Token:", data.token.substring(0, 50) + "...");
    } else if (data.message && data.message.includes("already")) {
      console.log(
        "\n⚠️  User already exists (signup might have worked before)"
      );
    } else if (data.message) {
      console.log("\n❌ Error:", data.message);
    }
  })
  .catch((err) => {
    console.error("\n❌ Network Error:", err.message);
  });
