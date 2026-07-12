const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/org');
const assetRoutes = require('./routes/assets');
const allocationRoutes = require('./routes/allocations');
const bookingRoutes = require('./routes/bookings');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes - one mount per module/person
app.use('/api/auth', authRoutes);
app.use('/api', orgRoutes); // /api/departments, /api/categories, /api/employees
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, data: 'ok' }));

// Serve the frontend (single-page app)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AssetFlow backend running at http://localhost:${PORT}`);
  console.log('Seeded logins:');
  console.log('  Admin          admin@assetflow.io / admin123');
  console.log('  Asset Manager  manager@assetflow.io / password123');
  console.log('  Employee       priya@assetflow.io / password123');
  console.log('  Employee       raj@assetflow.io / password123');
});
