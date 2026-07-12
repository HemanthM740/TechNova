const express = require('express');
const crypto = require('crypto');
const { db, id, hashPassword } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - always creates a plain Employee account
router.post('/signup', (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required' });
  }
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }
  const user = {
    id: id('usr'),
    name,
    email,
    passwordHash: hashPassword(password),
    department: department || null,
    role: 'Employee', // No role selection at signup, by design
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  const { passwordHash, ...safeUser } = user;
  res.status(201).json({ success: true, data: safeUser });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password || '')) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
  if (user.status !== 'Active') {
    return res.status(403).json({ success: false, error: 'Account is inactive' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = user.id;
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: { token, user: safeUser } });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({ success: true, data: safeUser });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) delete db.sessions[token];
  res.json({ success: true, data: null });
});

// POST /api/auth/promote - Admin only. The ONLY place roles are assigned.
router.post('/promote', requireAuth, requireRole('Admin'), (req, res) => {
  const { userId, role } = req.body;
  if (!['DepartmentHead', 'AssetManager', 'Employee'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  user.role = role;
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

module.exports = router;
