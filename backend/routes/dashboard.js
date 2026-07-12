const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - KPI snapshot
router.get('/', requireAuth, (req, res) => {
  const now = new Date();

  const assetsAvailable = db.assets.filter((a) => a.status === 'Available').length;
  const assetsAllocated = db.assets.filter((a) => a.status === 'Allocated').length;
  const underMaintenance = db.assets.filter((a) => a.status === 'Under Maintenance').length;

  const activeBookings = db.bookings.filter((b) => {
    if (b.status === 'Cancelled') return false;
    return new Date(b.end) >= now;
  }).length;

  const pendingMaintenance = db.maintenanceRequests.filter((m) => m.status === 'Pending').length;

  const overdueReturns = db.allocations.filter(
    (al) => al.status === 'Active' && al.expectedReturnDate && new Date(al.expectedReturnDate) < now
  );

  const upcomingReturns = db.allocations.filter(
    (al) => al.status === 'Active' && al.expectedReturnDate && new Date(al.expectedReturnDate) >= now
  );

  res.json({
    success: true,
    data: {
      assetsAvailable,
      assetsAllocated,
      underMaintenance,
      activeBookings,
      pendingMaintenance,
      overdueReturnsCount: overdueReturns.length,
      upcomingReturnsCount: upcomingReturns.length,
      overdueReturns,
      upcomingReturns,
    },
  });
});

module.exports = router;
