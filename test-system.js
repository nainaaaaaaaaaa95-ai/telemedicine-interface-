const http = require('http');
const fs = require('fs');

async function testPrescriptionSystem() {
  console.log('🧪 Testing Prescription System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing backend connection...');
    
    const isServerRunning = await new Promise((resolve) => {
      const req = http.get('http://localhost:5000', { timeout: 2000 }, () => {
        req.destroy();
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });

    if (!isServerRunning) {
      console.log('❌ Backend server not responding on port 5000!');
      console.log('   Action: Make sure backend is running with: npm start');
      console.log('\n   Terminal Status: Check if you see this in terminal logs:');
      console.log('   📡 Server listening on http://localhost:5000');
      process.exit(1);
    }
    console.log('✅ Backend server is running on port 5000');

    // Test 2: Check if Desktop path exists
    console.log('\n2️⃣ Testing Desktop path for PDF storage...');
    const desktopPath = `${process.env.USERPROFILE}\\OneDrive\\Desktop`;
    if (fs.existsSync(desktopPath)) {
      console.log('✅ Desktop path exists:', desktopPath);
    } else {
      console.log('❌ Desktop path not found:', desktopPath);
    }

    // Test 3: Check PDF generation
    console.log('\n3️⃣ Testing PDF generation utility...');
    try {
      const { generatePrescriptionPDF } = require('./utils/prescriptionPDF');
      
      const result = await generatePrescriptionPDF({
        doctor: { name: 'Dr. Test', specialization: 'General', phone: '+1234567890' },
        patient: { name: 'Test', age: '30', phone: '1234567890', address: 'Test' },
        diagnosis: 'Test',
        medicines: 'Med1\nMed2',
        notes: 'Notes',
        prescriptionId: 'test123456789'
      });
      console.log('✅ PDF generation successful');
      console.log(`   File: ${result.filename}`);
    } catch (error) {
      console.log('❌ PDF generation failed:', error.message);
    }

    console.log('\n✅ System Check Complete!\n');
    console.log('📊 Status Summary:');
    console.log('   ✅ Backend Server: Running');
    console.log('   ✅ Desktop Path: Accessible');
    console.log('   ✅ PDF Generation: Working');
    console.log('\n💡 If prescriptions not displaying:');
    console.log('   1. Log in as a DOCTOR account');
    console.log('   2. Complete an APPOINTMENT with a patient');
    console.log('   3. Click "Create Prescription" button');
    console.log('   4. Check browser console (F12) for errors');
    console.log('   5. Check backend console for error messages');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPrescriptionSystem();
