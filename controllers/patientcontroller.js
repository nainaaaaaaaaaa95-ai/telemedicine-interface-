
const db = require("../config/db");

/* GET all patients */
exports.getAllPatients = (req, res) => {
  const sql = "SELECT * FROM patients";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

/* ADD new patient */
exports.addPatient = (req, res) => {
  const { name, age, gender, phone, email, address } = req.body;

  const sql = `
    INSERT INTO patients (name, age, gender, phone, email, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, age, gender, phone, email, address], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Patient added successfully",
      patientId: result.insertId
    });
  });
};
