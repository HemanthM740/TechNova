const express = require('express');
const { db, id, nextAssetTag } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/assets?status=&category=&search=&bookable=
router.get('/', requireAuth, (req, res) => {
  const { status, category, search, bookable } = req.query;
  let results = [...db.assets];
  if (status) results = results.filter((a) => a.status === status);
  if (category) results = results.filter((a) => a.category === category);
  if (bookable !== undefined) results = results.filter((a) => a.bookable === (bookable === 'true'));
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, data: results });
});

router.get('/:assetId', requireAuth, (req, res) => {
  const asset = db.assets.find((a) => a.id === req.params.assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });

  const allocationHistory = db.allocations.filter((al) => al.assetId === asset.id);
  const maintenanceHistory = db.maintenanceRequests.filter((m) => m.assetId === asset.id);
  res.json({ success: true, data: { ...asset, allocationHistory, maintenanceHistory } });
});

// POST /api/assets - register a new asset (Admin / AssetManager)
router.post('/', requireAuth, requireRole('Admin', 'AssetManager'), (req, res) => {
  const { name, category, serialNumber, acquisitionDate, acquisitionCost, condition, location, bookable } = req.body;
  if (!name || !category) {
    return res.status(400).json({ success: false, error: 'Name and category are required' });
  }
  const asset = {
    id: id('ast'),
    tag: nextAssetTag(),
    name,
    category,
    serialNumber: serialNumber || '',
    acquisitionDate: acquisitionDate || null,
    acquisitionCost: acquisitionCost || 0,
    condition: condition || 'Good',
    location: location || '',
    bookable: !!bookable,
    status: 'Available',
    createdAt: new Date().toISOString(),
  };
  db.assets.push(asset);
  res.status(201).json({ success: true, data: asset });
});

router.patch('/:assetId', requireAuth, requireRole('Admin', 'AssetManager'), (req, res) => {
  const asset = db.assets.find((a) => a.id === req.params.assetId);
  if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
  const { tag, id: _id, ...updatable } = req.body;
  Object.assign(asset, updatable);
  res.json({ success: true, data: asset });
});

module.exports = router;
