const express = require('express');
const { db, id } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---- Departments ----
router.get('/departments', requireAuth, (req, res) => {
  res.json({ success: true, data: db.departments });
});

router.post('/departments', requireAuth, requireRole('Admin'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Department name is required' });
  const dept = { id: id('dept'), name, status: 'Active' };
  db.departments.push(dept);
  res.status(201).json({ success: true, data: dept });
});

router.patch('/departments/:deptId', requireAuth, requireRole('Admin'), (req, res) => {
  const dept = db.departments.find((d) => d.id === req.params.deptId);
  if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });
  Object.assign(dept, req.body);
  res.json({ success: true, data: dept });
});

// ---- Categories ----
router.get('/categories', requireAuth, (req, res) => {
  res.json({ success: true, data: db.categories });
});

router.post('/categories', requireAuth, requireRole('Admin'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });
  const cat = { id: id('cat'), name, status: 'Active' };
  db.categories.push(cat);
  res.status(201).json({ success: true, data: cat });
});

// ---- Employee Directory ----
router.get('/employees', requireAuth, (req, res) => {
  const employees = db.users.map(({ passwordHash, ...safe }) => safe);
  res.json({ success: true, data: employees });
});

module.exports = router;
