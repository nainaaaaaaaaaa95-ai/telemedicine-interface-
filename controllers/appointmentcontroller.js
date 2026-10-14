const db = require('../config/db');

exports.createAppointment = (req, res) => {
  const { patient_id, doctor_id, date, time } = req.body;

  db.query(
    'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time, status) VALUES (?, ?, ?, ?, "Pending")',
    [patient_id, doctor_id, date, time],
    () => {
      res.json({ success: true });
    }
  );
};

exports.getTodayAppointments = (req, res) => {
  db.query(
    'SELECT * FROM appointments WHERE appointment_date = CURDATE()',
    (err, result) => {
      res.json(result);
    }
  );
};

exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  db.query(
    'UPDATE appointments SET status=? WHERE id=?',
    [status, id],
    () => {
      res.json({ success: true });
    }
  );
};
