const express = require('express');
const { db, id } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function overlaps(startA, endA, startB, endB) {
  // Two ranges overlap if one starts before the other ends, on both sides.
  // Adjacent slots (endA === startB) are NOT an overlap.
  return startA < endB && startB < endA;
}

function computeStatus(booking) {
  if (booking.status === 'Cancelled') return 'Cancelled';
  const now = new Date();
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}

// GET /api/bookings?resourceId=
router.get('/', requireAuth, (req, res) => {
  const { resourceId } = req.query;
  let results = [...db.bookings];
  if (resourceId) results = results.filter((b) => b.resourceId === resourceId);
  results = results.map((b) => ({ ...b, status: computeStatus(b) }));
  res.json({ success: true, data: results });
});

// POST /api/bookings - book a resource for a time slot
router.post('/', requireAuth, (req, res) => {
  const { resourceId, start, end } = req.body;
  if (!resourceId || !start || !end) {
    return res.status(400).json({ success: false, error: 'resourceId, start and end are required' });
  }
  const resource = db.assets.find((a) => a.id === resourceId);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
  if (!resource.bookable) {
    return res.status(400).json({ success: false, error: 'This asset is not marked as a bookable resource' });
  }

  const startTime = new Date(start);
  const endTime = new Date(end);
  if (!(startTime < endTime)) {
    return res.status(400).json({ success: false, error: 'Start time must be before end time' });
  }

  const conflict = db.bookings.find(
    (b) =>
      b.resourceId === resourceId &&
      b.status !== 'Cancelled' &&
      overlaps(startTime, endTime, new Date(b.start), new Date(b.end))
  );
  if (conflict) {
    return res.status(409).json({
      success: false,
      error: `Time slot overlaps an existing booking (${conflict.start} - ${conflict.end})`,
      data: { conflictingBookingId: conflict.id },
    });
  }

  const booking = {
    id: id('bkg'),
    resourceId,
    bookedBy: req.user.id,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    status: 'Upcoming',
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);
  res.status(201).json({ success: true, data: booking });
});

// POST /api/bookings/:bookingId/cancel
router.post('/:bookingId/cancel', requireAuth, (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  booking.status = 'Cancelled';
  res.json({ success: true, data: booking });
});

module.exports = router;
