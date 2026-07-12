const { db } = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token && db.sessions[token];
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status !== 'Active') {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
