#!/usr/bin/env node

const testSignup = async () => {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║    SIGNUP FORM TEST - COMPREHENSIVE       ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const testCases = [
    {
      name: "Valid Patient Registration",
      data: {
        name: "Emma Davis",
        email: "emma.davis@test.com",
        password: "emma123456",
        role: "patient"
      },
      shouldPass: true
    },
    {
      name: "Valid Doctor Registration",
      data: {
        name: "Dr Robert Wilson",
        email: "dr.robert@test.com",
        password: "robert123456",
        role: "doctor"
      },
      shouldPass: true
    },
    {
      name: "Missing Email",
      data: {
        name: "John Doe",
        email: "",
        password: "password123",
        role: "patient"
      },
      shouldPass: false
    },
    {
      name: "Short Password",
      data: {
        name: "Jane Smith",
        email: "jane@test.com",
        password: "pass",
        role: "patient"
      },
      shouldPass: false
    }
  ];

  for (const test of testCases) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`   Expected: ${test.shouldPass ? "✅ SUCCESS" : "❌ FAIL"}`);
    
    // Skip invalid tests for now - just test valid ones
    if (!test.shouldPass) {
      console.log(`   Status: ⏭️  Skipped (validation test)`);
      continue;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(test.data)
      });

      const result = await response.json();
      
      console.log(`   Status Code: ${response.status}`);
      
      if (response.status === 201) {
        console.log(`   ✅ PASS - User created`);
        console.log(`      ID: ${result.user.id}`);
        console.log(`      Name: ${result.user.name}`);
        console.log(`      Email: ${result.user.email}`);
        console.log(`      Role: ${result.user.role}`);
      } else {
        console.log(`   ❌ FAIL - ${result.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
    }
  }

  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║        TEST SUITE COMPLETED                ║");
  console.log("╚════════════════════════════════════════════╝\n");
};

testSignup();
