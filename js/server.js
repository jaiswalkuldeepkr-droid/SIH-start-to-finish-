const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Error opening database', err.message);
  else console.log('Connected to the SQLite database.');
});

// Create Tables and Seed Initial Data
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY,
    type TEXT,
    manufacturer TEXT,
    model TEXT,
    serial TEXT,
    owner TEXT,
    state TEXT,
    location TEXT,
    status TEXT,
    lastVerified TEXT,
    validUntil TEXT,
    certId TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    instrumentId TEXT,
    appliedOn TEXT,
    officer TEXT,
    status TEXT,
    FOREIGN KEY(instrumentId) REFERENCES instruments(id)
  )`);

  db.get("SELECT COUNT(*) as count FROM instruments", (err, row) => {
    if (row.count === 0) {
      console.log('Seeding initial database records...');
      const seedInstruments = [
        ["WM-2026-004512", "Weighing Scale", "Avery India", "30kg platform scale", "SN-88213", "Anita Grocers", "Uttar Pradesh", "Sadar Bazaar, Ghaziabad, Uttar Pradesh", "Verified", "2026-03-12", "2026-09-08", "CERT-2026-31207"],
        ["FD-2025-118820", "Fuel Dispenser", "Tokheim", "Quantium 510", "SN-51092", "Singh Fuel Point", "Rajasthan", "NH-48, Ajmer, Rajasthan", "Expired", "2025-01-20", "2026-01-20", "CERT-2025-08841"],
        ["WB-2024-003310", "Weighbridge", "Avery Weigh-Tronix", "80-tonne pit type", "SN-20044", "Patel Weighbridge Services", "Gujarat", "GIDC Vatva, Ahmedabad, Gujarat", "Verified", "2026-06-02", "2027-04-03", "CERT-2026-40120"],
        ["WT-2026-000871", "Water Meter", "Kirloskar Brothers", "DN25 rotary", "SN-77341", "City Water Works", "Maharashtra", "Ward 14, Pune, Maharashtra", "Pending", null, null, null],
        ["TM-2025-005530", "Taximeter", "Digitax", "DT-200", "SN-33218", "Metro Taxi Co-op", "Karnataka", "Koramangala, Bengaluru, Karnataka", "Verified", "2026-05-15", "2026-09-27", "CERT-2026-38820"],
        ["WM-2025-002215", "Weighing Scale", "Essae Digitronics", "20kg counter scale", "SN-19004", "Sharma & Sons Kirana", "Bihar", "Boring Road, Patna, Bihar", "Rejected", null, null, null]
      ];

      const stmt = db.prepare(`INSERT INTO instruments VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
      seedInstruments.forEach(inst => stmt.run(inst));
      stmt.finalize();

      db.run(`INSERT INTO applications VALUES ('APP-88031', 'WT-2026-000871', '2026-08-20', 'Insp. K. Verma', 'Scheduled')`);
      db.run(`INSERT INTO applications VALUES ('APP-88032', 'WM-2025-002215', '2026-07-02', 'Insp. R. Nair', 'Rejected')`);
      db.run(`INSERT INTO applications VALUES ('APP-88033', 'FD-2025-118820', '2026-09-01', 'Insp. S. Bano', 'Scheduled')`);
    }
  });
});

// --- API ENDPOINTS ---
app.get('/api/instruments', (req, res) => {
  db.all("SELECT * FROM instruments", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/applications', (req, res) => {
  db.all("SELECT * FROM applications", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/instruments', (req, res) => {
  const { id, type, manufacturer, model, serial, owner, state, location, status } = req.body;
  const query = `INSERT INTO instruments (id, type, manufacturer, model, serial, owner, state, location, status, lastVerified, validUntil, certId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  db.run(query, [id, type, manufacturer, model, serial, owner, state, location, status, null, null, null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.post('/api/applications', (req, res) => {
  const { id, instrumentId, appliedOn, officer, status } = req.body;
  const query = `INSERT INTO applications (id, instrumentId, appliedOn, officer, status) VALUES (?,?,?,?,?)`;
  db.run(query, [id, instrumentId, appliedOn, officer, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/applications/:id', (req, res) => {
  const { status, validUntil, certId, lastVerified } = req.body;
  const appId = req.params.id;

  db.get("SELECT instrumentId FROM applications WHERE id = ?", [appId], (err, appRow) => {
    if (err || !appRow) return res.status(404).json({ error: "Application not found" });
    const instrumentId = appRow.instrumentId;

    db.serialize(() => {
      db.run("UPDATE applications SET status = ? WHERE id = ?", [status, appId]);
      if (status === 'Verified') {
        db.run("UPDATE instruments SET status = ?, lastVerified = ?, validUntil = ?, certId = ? WHERE id = ?",
          ['Verified', lastVerified, validUntil, certId, instrumentId]);
      } else {
        db.run("UPDATE instruments SET status = ? WHERE id = ?", ['Rejected', instrumentId]);
      }
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});