#!/usr/bin/env node

const BASE_URL = "http://localhost:5000";

async function test() {
  try {
    console.log("1️⃣  Testing Health Check...");
    const healthRes = await fetch(`${BASE_URL}/`);
    const healthData = await healthRes.json();
    console.log("✅ Health Check:", JSON.stringify(healthData, null, 2));

    console.log("\n2️⃣  Testing Signup...");
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@test.com",
        password: "Test@1234",
        passwordConfirm: "Test@1234",
        role: "patient"
      })
    });
    const signupData = await signupRes.json();
    console.log(`✅ Signup (Status ${signupRes.status}):`, JSON.stringify(signupData, null, 2));

    if (signupRes.status === 201) {
      const userId = signupData.user.id;

      console.log("\n3️⃣  Testing Login...");
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@test.com",
          password: "Test@1234"
        })
      });
      const loginData = await loginRes.json();
      console.log(`✅ Login (Status ${loginRes.status}):`, JSON.stringify(loginData, null, 2));

      if (loginRes.status === 200) {
        const token = loginData.token;

        console.log("\n4️⃣  Testing Get Profile...");
        const profileRes = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        console.log(`✅ Profile (Status ${profileRes.status}):`, JSON.stringify(profileData, null, 2));
      }
    }

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
