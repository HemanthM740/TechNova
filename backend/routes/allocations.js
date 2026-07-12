const express = require('express');
const { db, id } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function activeAllocationFor(assetId) {
  return db.allocations.find((al) => al.assetId === assetId && al.status === 'Active');
}

// GET /api/allocations
router.get('/', requireAuth, (req, res) => {
  res.json({ success: true, data: db.allocations });
});

// POST /api/allocations - allocate an asset to an employee
// Conflict rule: if the asset is already actively allocated to someone else,
// block the request and tell the caller who currently holds it.
router.post('/', requireAuth, requireRole('Admin', 'AssetManager', 'DepartmentHead'), (req, res) => {
  const { assetId, employeeId, expectedReturnDate } = req.body;
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

  const existing = activeAllocationFor(assetId);
  if (existing) {
    const holder = db.users.find((u) => u.id === existing.employeeId);
    return res.status(409).json({
      success: false,
      error: `Asset is currently held by ${holder ? holder.name : 'another employee'}`,
      data: { heldBy: holder ? { id: holder.id, name: holder.name } : null, allocationId: existing.id },
    });
  }

  if (['Under Maintenance', 'Lost', 'Retired', 'Disposed'].includes(asset.status)) {
    return res.status(400).json({ success: false, error: `Asset cannot be allocated while status is ${asset.status}` });
  }

  const allocation = {
    id: id('alc'),
    assetId,
    employeeId,
    allocatedAt: new Date().toISOString(),
    expectedReturnDate: expectedReturnDate || null,
    returnedAt: null,
    status: 'Active',
  };
  db.allocations.push(allocation);
  asset.status = 'Allocated';
  res.status(201).json({ success: true, data: allocation });
});

// POST /api/allocations/:allocationId/return
router.post('/:allocationId/return', requireAuth, (req, res) => {
  const allocation = db.allocations.find((al) => al.id === req.params.allocationId);
  if (!allocation) return res.status(404).json({ success: false, error: 'Allocation not found' });
  if (allocation.status !== 'Active') {
    return res.status(400).json({ success: false, error: 'Allocation is not active' });
  }
  allocation.status = 'Returned';
  allocation.returnedAt = new Date().toISOString();
  allocation.conditionNotes = req.body.conditionNotes || '';

  const asset = db.assets.find((a) => a.id === allocation.assetId);
  if (asset) asset.status = 'Available';

  res.json({ success: true, data: allocation });
});

// POST /api/allocations/:allocationId/transfer
// Simplified transfer: directly re-allocates to the new employee and closes
// out the old allocation. History is preserved via the allocations list.
router.post('/:allocationId/transfer', requireAuth, requireRole('Admin', 'AssetManager', 'DepartmentHead'), (req, res) => {
  const { toEmployeeId, expectedReturnDate } = req.body;
  const oldAllocation = db.allocations.find((al) => al.id === req.params.allocationId);
  if (!oldAllocation || oldAllocation.status !== 'Active') {
    return res.status(400).json({ success: false, error: 'Active allocation not found' });
  }
  oldAllocation.status = 'Transferred';
  oldAllocation.returnedAt = new Date().toISOString();

  const newAllocation = {
    id: id('alc'),
    assetId: oldAllocation.assetId,
    employeeId: toEmployeeId,
    allocatedAt: new Date().toISOString(),
    expectedReturnDate: expectedReturnDate || null,
    returnedAt: null,
    status: 'Active',
    transferredFrom: oldAllocation.id,
  };
  db.allocations.push(newAllocation);

  const asset = db.assets.find((a) => a.id === oldAllocation.assetId);
  if (asset) asset.status = 'Allocated';

  res.status(201).json({ success: true, data: newAllocation });
});

// GET /api/allocations/overdue
router.get('/overdue', requireAuth, (req, res) => {
  const now = new Date();
  const overdue = db.allocations.filter(
    (al) => al.status === 'Active' && al.expectedReturnDate && new Date(al.expectedReturnDate) < now
  );
  res.json({ success: true, data: overdue });
});

module.exports = router;
