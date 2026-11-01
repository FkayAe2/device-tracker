/**
 * routes/devices.js — Full CRUD for devices with history logging,
 * search, filter, sort, pagination, and CSV export.
 */

const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All device routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────
const VALID_TYPES = ['Computer', 'Laptop', 'Printer', 'Scanner', 'Photocopier', 'Network Equipment', 'Other'];
const VALID_DEPARTMENTS = [
  'ICT', 'Finance and Accounts', 'Legal Services',
  'Human Resources', 'Public Affairs', 'Privatisation and Commercialisation'
];
const VALID_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Faulty', 'Under Repair', 'Retired'];
const VALID_STATUSES = ['Available', 'In Use', 'In Repair', 'Retired'];

function validateDevice(data, isUpdate = false) {
  const errors = [];
  if (!isUpdate || data.device_name !== undefined) {
    if (!data.device_name || !data.device_name.trim()) errors.push('Device name is required.');
  }
  if (!isUpdate || data.asset_tag !== undefined) {
    if (!data.asset_tag || !data.asset_tag.trim()) errors.push('Asset tag is required.');
  }
  if (!isUpdate || data.device_type !== undefined) {
    if (!VALID_TYPES.includes(data.device_type)) errors.push('Invalid device type.');
  }
  if (!isUpdate || data.department !== undefined) {
    if (!VALID_DEPARTMENTS.includes(data.department)) errors.push('Invalid department.');
  }
  if (data.condition !== undefined && !VALID_CONDITIONS.includes(data.condition)) {
    errors.push('Invalid condition.');
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push('Invalid status.');
  }
  return errors;
}

// ─────────────────────────────────────────────
// Log a history entry
// ─────────────────────────────────────────────
function logHistory(device_id, action, field_name, old_value, new_value, performed_by) {
  db.prepare(`
    INSERT INTO history (device_id, action, field_name, old_value, new_value, performed_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(device_id, action, field_name, old_value, new_value, performed_by);
}

// ─────────────────────────────────────────────
// GET /api/devices — list with search, filter, sort, pagination
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  const {
    q = '',
    device_type = '',
    department = '',
    condition = '',
    status = '',
    sort = 'created_at',
    order = 'desc',
    page = '1',
    limit = '20',
    export: doExport = ''
  } = req.query;

  const SORTABLE = ['id','device_name','asset_tag','device_type','brand','model',
    'serial_number','department','location','assigned_to','condition','status',
    'date_acquired','created_at','updated_at'];
  const safeSort = SORTABLE.includes(sort) ? sort : 'created_at';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  let where = 'WHERE 1=1';
  const params = [];

  if (q) {
    where += ' AND (device_name LIKE ? OR asset_tag LIKE ? OR serial_number LIKE ? OR assigned_to LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (device_type) { where += ' AND device_type = ?'; params.push(device_type); }
  if (department)  { where += ' AND department = ?';  params.push(department); }
  if (condition)   { where += ' AND condition = ?';   params.push(condition); }
  if (status)      { where += ' AND status = ?';      params.push(status); }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM devices ${where}`).get(...params);
  const total = countRow.total;

  // CSV export — no pagination
  if (doExport === 'csv') {
    const rows = db.prepare(`SELECT * FROM devices ${where} ORDER BY ${safeSort} ${safeOrder}`).all(...params);
    const fields = ['id','device_name','asset_tag','device_type','brand','model','serial_number',
      'department','location','assigned_to','condition','status','date_acquired','notes','created_at','updated_at'];
    const header = fields.join(',');
    const csvRows = rows.map(r =>
      fields.map(f => `"${(r[f] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...csvRows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bpe_devices.csv"');
    return res.send(csv);
  }

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset   = (pageNum - 1) * pageSize;

  const rows = db.prepare(
    `SELECT * FROM devices ${where} ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({ devices: rows, total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) });
});

// ─────────────────────────────────────────────
// GET /api/devices/dashboard — summary stats
// ─────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
  const byStatus    = db.prepare("SELECT status, COUNT(*) as count FROM devices GROUP BY status").all();
  const byCondition = db.prepare("SELECT condition, COUNT(*) as count FROM devices GROUP BY condition").all();
  const byDepartment= db.prepare("SELECT department, COUNT(*) as count FROM devices GROUP BY department").all();
  const byType      = db.prepare("SELECT device_type, COUNT(*) as count FROM devices GROUP BY device_type").all();
  const needsAttention = db.prepare(
    "SELECT * FROM devices WHERE condition IN ('Faulty','Under Repair') ORDER BY updated_at DESC"
  ).all();
  const recentActivity = db.prepare(
    "SELECT h.*, d.device_name, d.asset_tag FROM history h JOIN devices d ON h.device_id = d.id ORDER BY h.performed_at DESC LIMIT 10"
  ).all();

  res.json({ total, byStatus, byCondition, byDepartment, byType, needsAttention, recentActivity });
});

// ─────────────────────────────────────────────
// GET /api/devices/:id — single device + history
// ─────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found.' });

  const history = db.prepare(
    'SELECT * FROM history WHERE device_id = ? ORDER BY performed_at DESC'
  ).all(req.params.id);

  res.json({ device, history });
});

// ─────────────────────────────────────────────
// POST /api/devices — create new device
// ─────────────────────────────────────────────
router.post('/', (req, res) => {
  const errors = validateDevice(req.body, false);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const {
    device_name, asset_tag, device_type, brand = '', model = '',
    serial_number = '', department, location = '', assigned_to = '',
    condition = 'Good', status = 'Available', date_acquired = '', notes = ''
  } = req.body;

  // Check unique asset_tag
  const existing = db.prepare('SELECT id FROM devices WHERE asset_tag = ?').get(asset_tag.trim());
  if (existing) {
    return res.status(409).json({ error: `Asset tag "${asset_tag}" already exists. Asset tags must be unique.` });
  }

  const info = db.prepare(`
    INSERT INTO devices
      (device_name, asset_tag, device_type, brand, model, serial_number,
       department, location, assigned_to, condition, status, date_acquired, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    device_name.trim(), asset_tag.trim(), device_type, brand.trim(), model.trim(),
    serial_number.trim(), department, location.trim(), assigned_to.trim(),
    condition, status, date_acquired || null, notes.trim()
  );

  logHistory(
    info.lastInsertRowid, 'CREATE', null, null,
    JSON.stringify({ asset_tag, department, device_type }),
    req.user.username
  );

  const created = db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// ─────────────────────────────────────────────
// PUT /api/devices/:id — update device
// ─────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found.' });

  const errors = validateDevice(req.body, true);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  // If asset_tag is changing, check uniqueness
  if (req.body.asset_tag && req.body.asset_tag.trim() !== device.asset_tag) {
    const dup = db.prepare('SELECT id FROM devices WHERE asset_tag = ? AND id != ?').get(req.body.asset_tag.trim(), device.id);
    if (dup) {
      return res.status(409).json({ error: `Asset tag "${req.body.asset_tag}" already exists. Asset tags must be unique.` });
    }
  }

  // Track which fields changed for history
  const trackFields = [
    'device_name','asset_tag','device_type','brand','model','serial_number',
    'department','location','assigned_to','condition','status','date_acquired','notes'
  ];

  const updates = {};
  trackFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  // Build SET clause
  const setClauses = Object.keys(updates).map(f => `${f} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(req.params.id);

  db.prepare(`UPDATE devices SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).run(...values);

  // Log changed fields
  trackFields.forEach(f => {
    if (updates[f] !== undefined) {
      const oldVal = device[f] ?? '';
      const newVal = (updates[f] ?? '').toString().trim();
      if (oldVal.toString().trim() !== newVal) {
        logHistory(device.id, 'UPDATE', f, oldVal.toString(), newVal, req.user.username);
      }
    }
  });

  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ─────────────────────────────────────────────
// DELETE /api/devices/:id — admin only
// ─────────────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found.' });

  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  res.json({ message: `Device "${device.device_name}" (${device.asset_tag}) deleted successfully.` });
});

module.exports = router;

