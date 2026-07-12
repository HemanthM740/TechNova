const express = require('express');
const { db, id } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/maintenance
router.get('/', requireAuth, (req, res) => {
  res.json({ success: true, data: db.maintenanceRequests });
});

// POST /api/maintenance - raise a request (any authenticated employee)
router.post('/', requireAuth, (req, res) => {
  const { assetId, issue, priority } = req.body;
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

  const request = {
    id: id('mnt'),
    assetId,
    raisedBy: req.user.id,
    issue: issue || '',
    priority: priority || 'Medium',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    resolvedAt: null,
  };
  db.maintenanceRequests.push(request);
  res.status(201).json({ success: true, data: request });
});

// POST /api/maintenance/:requestId/approve - flips asset to Under Maintenance
router.post('/:requestId/approve', requireAuth, requireRole('Admin', 'AssetManager'), (req, res) => {
  const request = db.maintenanceRequests.find((m) => m.id === req.params.requestId);
  if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
  if (request.status !== 'Pending') {
    return res.status(400).json({ success: false, error: 'Only pending requests can be approved' });
  }
  request.status = 'Approved';
  request.approvedAt = new Date().toISOString();

  const asset = db.assets.find((a) => a.id === request.assetId);
  if (asset) asset.status = 'Under Maintenance';

  res.json({ success: true, data: request });
});

// POST /api/maintenance/:requestId/reject
router.post('/:requestId/reject', requireAuth, requireRole('Admin', 'AssetManager'), (req, res) => {
  const request = db.maintenanceRequests.find((m) => m.id === req.params.requestId);
  if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
  if (request.status !== 'Pending') {
    return res.status(400).json({ success: false, error: 'Only pending requests can be rejected' });
  }
  request.status = 'Rejected';
  res.json({ success: true, data: request });
});

// POST /api/maintenance/:requestId/resolve - asset back to Available
router.post('/:requestId/resolve', requireAuth, requireRole('Admin', 'AssetManager'), (req, res) => {
  const request = db.maintenanceRequests.find((m) => m.id === req.params.requestId);
  if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
  if (request.status !== 'Approved') {
    return res.status(400).json({ success: false, error: 'Only approved requests can be resolved' });
  }
  request.status = 'Resolved';
  request.resolvedAt = new Date().toISOString();

  const asset = db.assets.find((a) => a.id === request.assetId);
  if (asset) asset.status = 'Available';

  res.json({ success: true, data: request });
});

module.exports = router;
