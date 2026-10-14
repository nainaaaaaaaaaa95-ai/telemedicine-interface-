const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Get the actual Desktop path (handles OneDrive Desktop on Windows)
 */
function getDesktopPath() {
  try {
    // Try to get Desktop path from environment variable (Windows)
    if (process.platform === 'win32') {
      try {
        const result = execSync('powershell -Command "[Environment]::GetFolderPath(\'Desktop\')"', { 
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        if (result && fs.existsSync(result)) {
          return result;
        }
      } catch (e) {
        console.log('Could not get Desktop path from PowerShell, using fallback');
      }
    }
    
    // Fallback: try common Desktop locations
    const homeDir = os.homedir();
    const commonDesktopPaths = [
      path.join(homeDir, 'OneDrive', 'Desktop'),
      path.join(homeDir, 'Desktop'),
      path.join(homeDir, 'Documents', 'Desktop')
    ];
    
    for (const desktopPath of commonDesktopPaths) {
      if (fs.existsSync(desktopPath)) {
        console.log(`✅ Desktop path found: ${desktopPath}`);
        return desktopPath;
      }
    }
    
    // If no Desktop exists, try to use the first path and create it if needed
    const defaultDesktop = commonDesktopPaths[1]; // C:\Users\naina\Desktop
    console.log(`⚠️ Desktop path not found, using: ${defaultDesktop}`);
    if (!fs.existsSync(defaultDesktop)) {
      fs.mkdirSync(defaultDesktop, { recursive: true });
      console.log(`📁 Created Desktop directory: ${defaultDesktop}`);
    }
    return defaultDesktop;
  } catch (error) {
    console.error('Error getting Desktop path:', error);
    throw error;
  }
}

/**
 * Generate a professional prescription PDF and save to desktop
 */
async function generatePrescriptionPDF(prescriptionData) {
  return new Promise((resolve, reject) => {
    try {
      const { doctor, patient, diagnosis, medicines, notes, prescriptionId } = prescriptionData;

      // Get desktop path
      const desktopPath = getDesktopPath();
      
      // Create filename with timestamp (remove spaces to avoid Windows/OneDrive issues)
      const timestamp = new Date().toISOString().split('T')[0];
      const patientNameSafe = (patient?.name || 'Patient').replace(/\s+/g, '_');
      const filename = `Prescription_${patientNameSafe}_${timestamp}_${prescriptionId.substring(0, 8)}.pdf`;
      const filepath = path.join(desktopPath, filename);

      console.log(`📝 Generating PDF: ${filepath}`);

      // Create PDF document
      const pdf = new PDFDocument({
        size: 'A4',
        margins: {
          top: 40,
          bottom: 40,
          left: 50,
          right: 50
        }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(filepath);
      pdf.pipe(writeStream);

      // ========== HEADER ==========
      // Header background color (blue)
      pdf.rect(0, 0, pdf.page.width, 100)
        .fill('#2F5AA0');

      // Clinic name and logo
      pdf.fillColor('#FFFFFF')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('HEALTH CHOICE CLINIC', 60, 25);

      pdf.fontSize(10)
        .font('Helvetica')
        .text('Riverside St, Bingham, NY 130, [USA]', 60, 52)
        .text('[youremail@companyname.com | yourwebsite.com]', 60, 67);

      // Footer header
      pdf.moveTo(0, 100).lineTo(pdf.page.width, 100).stroke();

      // ========== DOCTOR INFO ==========
      pdf.fillColor('#000000')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(doctor?.name || 'Doctor Name', 60, 130);

      pdf.fontSize(10)
        .font('Helvetica')
        .text(doctor?.specialization || '[Medical Specialty]', 60, 147)
        .text(doctor?.phone || '[+1 XXX-XXX-XXXX]', 60, 162);

      // Prescription number and date on the right
      pdf.fontSize(10)
        .font('Helvetica')
        .text(`Prescription no.: ${prescriptionId.substring(0, 8).toUpperCase()}`, 380, 130)
        .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}`, 380, 147);

      // ========== MEDICINE SECTION HEADER ==========
      pdf.moveTo(50, 190).lineTo(pdf.page.width - 50, 190).stroke();
      
      pdf.fontSize(11)
        .font('Helvetica-Bold')
        .text('MEDICINES PRESCRIBED:', 60, 205);

      // ========== MEDICINES ==========
      const medicinesArray = medicines
        .split('\n')
        .filter(m => m.trim())
        .map(m => m.trim());

      let yPos = 235;
      medicinesArray.forEach((medicine, index) => {
        pdf.fontSize(10)
          .font('Helvetica')
          .text(`${index + 1}. ${medicine}`, 70, yPos, { width: 450 });
        yPos += 25;
      });

      // ========== DIAGNOSIS SECTION ==========
      yPos = Math.max(yPos + 20, 360);
      pdf.moveTo(50, yPos - 10).lineTo(pdf.page.width - 50, yPos - 10).stroke();
      
      pdf.fontSize(11)
        .font('Helvetica-Bold')
        .text('DIAGNOSIS:', 60, yPos);

      pdf.fontSize(10)
        .font('Helvetica')
        .text(diagnosis || 'No diagnosis provided', 70, yPos + 25, { 
          width: 450,
          align: 'left'
        });

      // ========== NOTES SECTION ==========
      if (notes && notes.trim()) {
        yPos += 80;
        pdf.moveTo(50, yPos - 10).lineTo(pdf.page.width - 50, yPos - 10).stroke();
        
        pdf.fontSize(11)
          .font('Helvetica-Bold')
          .text('SPECIAL NOTES:', 60, yPos);

        pdf.fontSize(10)
          .font('Helvetica')
          .text(notes, 70, yPos + 25, { 
            width: 450,
            align: 'left'
          });
      }

      // ========== PATIENT INFO SECTION ==========
      yPos = pdf.page.height - 180;
      pdf.moveTo(50, yPos).lineTo(pdf.page.width - 50, yPos).stroke();

      pdf.fontSize(10)
        .font('Helvetica')
        .text(`Mr./Ms./Mrs.: ${patient?.name || 'Patient Name'}`, 60, yPos + 15)
        .text(`Age: ${patient?.age || 'N/A'}`, 60, yPos + 35)
        .text(`Address: ${patient?.address || 'Not provided'}`, 60, yPos + 55)
        .text(`Contact Number: ${patient?.phone || 'Not provided'}`, 60, yPos + 75);

      // ========== FOOTER ==========
      pdf.rect(0, pdf.page.height - 50, pdf.page.width, 50)
        .fill('#2F5AA0');

      pdf.fillColor('#FFFFFF')
        .fontSize(10)
        .font('Helvetica')
        .text('☎ +1 302-747-4830', 60, pdf.page.height - 35)
        .text('📧 youremail@companyname.com', pdf.page.width / 2 - 80, pdf.page.height - 35);

      // End and write the PDF
      pdf.end();

      // Handle write stream events
      writeStream.on('finish', () => {
        console.log(`✅ Prescription PDF saved to: ${filepath}`);
        resolve({
          success: true,
          filename: filename,
          filepath: filepath
        });
      });

      writeStream.on('error', (err) => {
        console.error('❌ Error writing PDF:', err);
        reject(err);
      });

      pdf.on('error', (err) => {
        console.error('❌ Error generating PDF:', err);
        reject(err);
      });

    } catch (error) {
      console.error('❌ Error in PDF generation:', error);
      reject(error);
    }
  });
}

module.exports = { generatePrescriptionPDF };
