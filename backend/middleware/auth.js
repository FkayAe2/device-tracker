/**
 * middleware/auth.js — JWT authentication & role-checking middleware
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bpe_ict_device_tracker_super_secret_2024';

/**
 * authenticate — verifies the Bearer token in the Authorization header.
 * Sets req.user = { id, username, role } on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * requireAdmin — use after authenticate. Blocks non-admin users.
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'This action requires admin privileges.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };

