const { generatePrescriptionPDF } = require('./utils/prescriptionPDF');

async function testPDF() {
  console.log('🧪 Testing PDF generation...\n');

  const testData = {
    doctor: {
      name: 'Dr. Ashley D. Stone, M.D.',
      specialization: 'Medical Physician',
      phone: '+1 392-747-4830'
    },
    patient: {
      name: 'Jeffrey S. Brown',
      age: '22',
      phone: '320-988-3845',
      address: 'Matthew Rd, Vestal, NY 135, USA'
    },
    diagnosis: 'Viral Infection',
    medicines: 'Paracetamol, 500 mg; Once A Day\nIbuprofen, 600 mg; Thrice A Day, After Meal\nNaproxen Sodium, 500 mg; Once A Day',
    notes: 'Take medicines as prescribed. Complete the full course. If symptoms persist, consult immediately.',
    prescriptionId: '6507a1b2d3f4e5c6b7a8'
  };

  try {
    console.log('📝 Generating PDF with test data...');
    const result = await generatePrescriptionPDF(testData);
    console.log('\n✅ PDF Generated Successfully!');
    console.log(`   Filename: ${result.filename}`);
    console.log(`   Filepath: ${result.filepath}`);
    console.log('\n📂 Check your Desktop for the prescription PDF!');
  } catch (error) {
    console.error('❌ PDF Generation Failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPDF();
