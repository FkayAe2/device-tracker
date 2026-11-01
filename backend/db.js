/**
 * db.js — Database initialisation and seed for BPE Device Tracker
 * Uses better-sqlite3 (synchronous SQLite driver).
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'devices.db');

// Ensure the data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────
// Schema creation
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL CHECK(role IN ('admin','staff')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS devices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    device_name  TEXT NOT NULL,
    asset_tag    TEXT NOT NULL UNIQUE,
    device_type  TEXT NOT NULL,
    brand        TEXT,
    model        TEXT,
    serial_number TEXT,
    department   TEXT NOT NULL,
    location     TEXT,
    assigned_to  TEXT,
    condition    TEXT NOT NULL DEFAULT 'Good',
    status       TEXT NOT NULL DEFAULT 'Available',
    date_acquired TEXT,
    notes        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id   INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,
    field_name  TEXT,
    old_value   TEXT,
    new_value   TEXT,
    performed_by TEXT NOT NULL,
    performed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─────────────────────────────────────────────
// Seed users (idempotent)
// ─────────────────────────────────────────────
function seedUsers() {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  }
  const staffExists = db.prepare('SELECT id FROM users WHERE username = ?').get('staff');
  if (!staffExists) {
    const hash = bcrypt.hashSync('Staff@123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('staff', hash, 'staff');
  }
}

// ─────────────────────────────────────────────
// Seed devices (only if table is empty)
// ─────────────────────────────────────────────
function seedDevices() {
  const count = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
  if (count > 0) return;

  const devices = [
    {
      device_name: 'ICT Manager Desktop', asset_tag: 'BPE-ICT-001', device_type: 'Computer',
      brand: 'Dell', model: 'OptiPlex 7090', serial_number: 'DL7090-20221', department: 'ICT',
      location: 'Office 201, 2nd Floor', assigned_to: 'John Adeyemi', condition: 'Excellent',
      status: 'In Use', date_acquired: '2022-03-15', notes: 'ICT Manager primary workstation'
    },
    {
      device_name: 'Finance Director Laptop', asset_tag: 'BPE-FIN-001', device_type: 'Laptop',
      brand: 'HP', model: 'EliteBook 840 G9', serial_number: 'HP840-20231', department: 'Finance and Accounts',
      location: 'Office 105, 1st Floor', assigned_to: 'Amara Okonkwo', condition: 'Excellent',
      status: 'In Use', date_acquired: '2023-01-10', notes: 'Finance director personal laptop'
    },
    {
      device_name: 'Legal Services Printer', asset_tag: 'BPE-LEG-001', device_type: 'Printer',
      brand: 'HP', model: 'LaserJet Pro M404dn', serial_number: 'HPLJ-20201', department: 'Legal Services',
      location: 'Office 310, 3rd Floor', assigned_to: null, condition: 'Good',
      status: 'In Use', date_acquired: '2020-06-20', notes: 'Shared printer for legal team'
    },
    {
      device_name: 'HR Department Scanner', asset_tag: 'BPE-HR-001', device_type: 'Scanner',
      brand: 'Canon', model: 'imageFORMULA DR-C230', serial_number: 'CN-DR230-2021', department: 'Human Resources',
      location: 'Office 402, 4th Floor', assigned_to: 'Fatima Bello', condition: 'Fair',
      status: 'In Use', date_acquired: '2021-09-05', notes: 'Used for document scanning'
    },
    {
      device_name: 'Public Affairs Photocopier', asset_tag: 'BPE-PA-001', device_type: 'Photocopier',
      brand: 'Ricoh', model: 'IM 2702', serial_number: 'RC-IM2702-2022', department: 'Public Affairs',
      location: 'Office 505, 5th Floor', assigned_to: null, condition: 'Good',
      status: 'In Use', date_acquired: '2022-11-30', notes: 'Main photocopier for press materials'
    },
    {
      device_name: 'Core Network Switch', asset_tag: 'BPE-ICT-002', device_type: 'Network Equipment',
      brand: 'Cisco', model: 'Catalyst 9200L', serial_number: 'CSC-C9200-2023', department: 'ICT',
      location: 'Server Room, Basement', assigned_to: 'John Adeyemi', condition: 'Excellent',
      status: 'In Use', date_acquired: '2023-03-01', notes: 'Main network switch — do not restart without approval'
    },
    {
      device_name: 'P&C Staff Laptop', asset_tag: 'BPE-PC-001', device_type: 'Laptop',
      brand: 'Lenovo', model: 'ThinkPad L15', serial_number: 'LNV-L15-20221', department: 'Privatisation and Commercialisation',
      location: 'Office 601, 6th Floor', assigned_to: 'Chukwuemeka Eze', condition: 'Good',
      status: 'In Use', date_acquired: '2022-07-18', notes: 'Used for privatisation reports'
    },
    {
      device_name: 'ICT Help Desk Desktop', asset_tag: 'BPE-ICT-003', device_type: 'Computer',
      brand: 'HP', model: 'ProDesk 400 G9', serial_number: 'HP400G9-2022', department: 'ICT',
      location: 'Office 205, 2nd Floor', assigned_to: 'Ngozi Ibe', condition: 'Good',
      status: 'In Use', date_acquired: '2022-08-22', notes: 'Help desk workstation'
    },
    {
      device_name: 'Finance Accounts Printer', asset_tag: 'BPE-FIN-002', device_type: 'Printer',
      brand: 'Epson', model: 'EcoTank L6270', serial_number: 'EP-L6270-2021', department: 'Finance and Accounts',
      location: 'Office 110, 1st Floor', assigned_to: null, condition: 'Fair',
      status: 'In Use', date_acquired: '2021-04-12', notes: 'Needs periodic ink refill'
    },
    {
      device_name: 'Old Photocopier', asset_tag: 'BPE-ICT-004', device_type: 'Photocopier',
      brand: 'Xerox', model: 'WorkCentre 3335', serial_number: 'XR-WC3335-2018', department: 'ICT',
      location: 'Storage Room, Basement', assigned_to: null, condition: 'Faulty',
      status: 'In Repair', date_acquired: '2018-01-15', notes: 'Drum unit failure — awaiting parts'
    },
    {
      device_name: 'HR Manager Laptop', asset_tag: 'BPE-HR-002', device_type: 'Laptop',
      brand: 'Dell', model: 'Latitude 5530', serial_number: 'DL-L5530-2023', department: 'Human Resources',
      location: 'Office 405, 4th Floor', assigned_to: 'Blessing Uche', condition: 'Excellent',
      status: 'In Use', date_acquired: '2023-05-20', notes: ''
    },
    {
      device_name: 'Wireless Access Point', asset_tag: 'BPE-ICT-005', device_type: 'Network Equipment',
      brand: 'Ubiquiti', model: 'UniFi AP AC Pro', serial_number: 'UB-APAC-2022', department: 'ICT',
      location: '2nd Floor Corridor', assigned_to: null, condition: 'Good',
      status: 'In Use', date_acquired: '2022-06-01', notes: 'Covers 2nd floor offices'
    },
    {
      device_name: 'Legal Services Laptop', asset_tag: 'BPE-LEG-002', device_type: 'Laptop',
      brand: 'HP', model: 'ProBook 450 G9', serial_number: 'HP-PB450-2022', department: 'Legal Services',
      location: 'Office 315, 3rd Floor', assigned_to: 'Tunde Olatunji', condition: 'Good',
      status: 'In Use', date_acquired: '2022-10-10', notes: ''
    },
    {
      device_name: 'Backup Server', asset_tag: 'BPE-ICT-006', device_type: 'Computer',
      brand: 'Dell', model: 'PowerEdge T150', serial_number: 'DL-PE-T150-2022', department: 'ICT',
      location: 'Server Room, Basement', assigned_to: 'John Adeyemi', condition: 'Good',
      status: 'In Use', date_acquired: '2022-12-01', notes: 'Runs nightly backups at 2:00 AM'
    },
    {
      device_name: 'P&C Colour Printer', asset_tag: 'BPE-PC-002', device_type: 'Printer',
      brand: 'Canon', model: 'imageCLASS MF743Cdw', serial_number: 'CN-MF743-2023', department: 'Privatisation and Commercialisation',
      location: 'Office 605, 6th Floor', assigned_to: null, condition: 'Excellent',
      status: 'Available', date_acquired: '2023-07-15', notes: 'Colour printing for presentations'
    },
    {
      device_name: 'DG Office Desktop', asset_tag: 'BPE-DG-001', device_type: 'Computer',
      brand: 'Apple', model: 'Mac Mini M2', serial_number: 'APL-MM2-2023', department: 'ICT',
      location: "Director General's Office, 6th Floor", assigned_to: 'Alex Nwosu (DG)', condition: 'Excellent',
      status: 'In Use', date_acquired: '2023-09-01', notes: 'Director General workstation'
    },
    {
      device_name: 'Retired Scanner', asset_tag: 'BPE-HR-003', device_type: 'Scanner',
      brand: 'Fujitsu', model: 'ScanSnap iX500', serial_number: 'FJ-IX500-2016', department: 'Human Resources',
      location: 'Storage Room, Basement', assigned_to: null, condition: 'Retired',
      status: 'Retired', date_acquired: '2016-03-22', notes: 'End of life — replaced by BPE-HR-001'
    },
    {
      device_name: 'Finance Staff Desktop', asset_tag: 'BPE-FIN-003', device_type: 'Computer',
      brand: 'HP', model: 'EliteDesk 800 G9', serial_number: 'HP-ED800-2022', department: 'Finance and Accounts',
      location: 'Office 108, 1st Floor', assigned_to: 'Kemi Adebisi', condition: 'Good',
      status: 'In Use', date_acquired: '2022-05-30', notes: ''
    },
    {
      device_name: 'Firewall Appliance', asset_tag: 'BPE-ICT-007', device_type: 'Network Equipment',
      brand: 'Fortinet', model: 'FortiGate 60F', serial_number: 'FT-FG60F-2023', department: 'ICT',
      location: 'Server Room, Basement', assigned_to: 'John Adeyemi', condition: 'Excellent',
      status: 'In Use', date_acquired: '2023-02-14', notes: 'Main perimeter firewall — critical device'
    },
    {
      device_name: 'Under-Repair Laptop', asset_tag: 'BPE-PC-003', device_type: 'Laptop',
      brand: 'Lenovo', model: 'IdeaPad 3', serial_number: 'LNV-IP3-2020', department: 'Privatisation and Commercialisation',
      location: 'ICT Workshop, 2nd Floor', assigned_to: null, condition: 'Under Repair',
      status: 'In Repair', date_acquired: '2020-11-10', notes: 'Motherboard replacement in progress'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO devices
      (device_name, asset_tag, device_type, brand, model, serial_number, department,
       location, assigned_to, condition, status, date_acquired, notes)
    VALUES
      (@device_name, @asset_tag, @device_type, @brand, @model, @serial_number, @department,
       @location, @assigned_to, @condition, @status, @date_acquired, @notes)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO history (device_id, action, field_name, old_value, new_value, performed_by, performed_at)
    VALUES (@device_id, @action, @field_name, @old_value, @new_value, @performed_by, @performed_at)
  `);

  const insertMany = db.transaction(() => {
    for (const device of devices) {
      const info = insert.run(device);
      // Seed: creation history entry
      insertHistory.run({
        device_id: info.lastInsertRowid,
        action: 'CREATE',
        field_name: null,
        old_value: null,
        new_value: JSON.stringify({ asset_tag: device.asset_tag, department: device.department }),
        performed_by: 'admin',
        performed_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
  });

  insertMany();

  // Add some extra history entries for variety
  const allDevices = db.prepare('SELECT id, asset_tag FROM devices').all();

  // Device 1: location change
  insertHistory.run({
    device_id: allDevices[0].id,
    action: 'UPDATE',
    field_name: 'location',
    old_value: 'Office 101, 1st Floor',
    new_value: 'Office 201, 2nd Floor',
    performed_by: 'admin',
    performed_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Device 10: condition change to Faulty
  insertHistory.run({
    device_id: allDevices[9].id,
    action: 'UPDATE',
    field_name: 'condition',
    old_value: 'Good',
    new_value: 'Faulty',
    performed_by: 'staff',
    performed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  insertHistory.run({
    device_id: allDevices[9].id,
    action: 'UPDATE',
    field_name: 'status',
    old_value: 'In Use',
    new_value: 'In Repair',
    performed_by: 'admin',
    performed_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Device 4: reassignment
  insertHistory.run({
    device_id: allDevices[3].id,
    action: 'UPDATE',
    field_name: 'assigned_to',
    old_value: 'Kola Adesanya',
    new_value: 'Fatima Bello',
    performed_by: 'admin',
    performed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  });

  console.log('✅ 20 sample devices and history entries seeded successfully.');
}

// Run seed
seedUsers();
seedDevices();

module.exports = db;

