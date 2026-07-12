// db.js
// Simple in-memory data store for the AssetFlow hackathon build.
// Data resets whenever the server restarts. This keeps the project
// runnable instantly by anyone on the team with zero DB setup.

const crypto = require('crypto');

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const db = {
  users: [],
  departments: [],
  categories: [],
  assets: [],
  allocations: [],
  bookings: [],
  maintenanceRequests: [],
  sessions: {}, // token -> userId
  assetTagCounter: 0,
};

function nextAssetTag() {
  db.assetTagCounter += 1;
  return `AF-${String(db.assetTagCounter).padStart(4, '0')}`;
}

// ---------- Seed data ----------
function seed() {
  // Departments
  const deptEng = { id: id('dept'), name: 'Engineering', status: 'Active' };
  const deptOps = { id: id('dept'), name: 'Operations', status: 'Active' };
  db.departments.push(deptEng, deptOps);

  // Categories
  const catElectronics = { id: id('cat'), name: 'Electronics', status: 'Active' };
  const catFurniture = { id: id('cat'), name: 'Furniture', status: 'Active' };
  const catRoom = { id: id('cat'), name: 'Meeting Room', status: 'Active' };
  db.categories.push(catElectronics, catFurniture, catRoom);

  // Users (Admin + Employees)
  const admin = {
    id: id('usr'),
    name: 'Ava Admin',
    email: 'admin@assetflow.io',
    passwordHash: hashPassword('admin123'),
    department: deptOps.id,
    role: 'Admin',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  const priya = {
    id: id('usr'),
    name: 'Priya Sharma',
    email: 'priya@assetflow.io',
    passwordHash: hashPassword('password123'),
    department: deptEng.id,
    role: 'Employee',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  const raj = {
    id: id('usr'),
    name: 'Raj Verma',
    email: 'raj@assetflow.io',
    passwordHash: hashPassword('password123'),
    department: deptEng.id,
    role: 'Employee',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  const manager = {
    id: id('usr'),
    name: 'Meera Asset-Manager',
    email: 'manager@assetflow.io',
    passwordHash: hashPassword('password123'),
    department: deptOps.id,
    role: 'AssetManager',
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  db.users.push(admin, priya, raj, manager);

  // Assets
  const laptop = {
    id: id('ast'),
    tag: nextAssetTag(),
    name: 'Laptop AF-0114',
    category: catElectronics.id,
    serialNumber: 'SN-LAPTOP-0114',
    acquisitionDate: '2024-11-01',
    acquisitionCost: 1200,
    condition: 'Good',
    location: 'HQ - Floor 2',
    bookable: false,
    status: 'Allocated',
    createdAt: new Date().toISOString(),
  };
  const chair = {
    id: id('ast'),
    tag: nextAssetTag(),
    name: 'Ergonomic Chair #12',
    category: catFurniture.id,
    serialNumber: 'SN-CHAIR-0012',
    acquisitionDate: '2024-06-15',
    acquisitionCost: 250,
    condition: 'Good',
    location: 'HQ - Floor 1',
    bookable: false,
    status: 'Available',
    createdAt: new Date().toISOString(),
  };
  const roomB2 = {
    id: id('ast'),
    tag: nextAssetTag(),
    name: 'Room B2',
    category: catRoom.id,
    serialNumber: 'SN-ROOM-B2',
    acquisitionDate: '2023-01-01',
    acquisitionCost: 0,
    condition: 'Good',
    location: 'HQ - Floor 3',
    bookable: true,
    status: 'Available',
    createdAt: new Date().toISOString(),
  };
  const projector = {
    id: id('ast'),
    tag: nextAssetTag(),
    name: 'Projector - Epson EX200',
    category: catElectronics.id,
    serialNumber: 'SN-PROJ-0021',
    acquisitionDate: '2024-02-10',
    acquisitionCost: 400,
    condition: 'Fair',
    location: 'HQ - Storage',
    bookable: true,
    status: 'Available',
    createdAt: new Date().toISOString(),
  };
  db.assets.push(laptop, chair, roomB2, projector);

  // Existing allocation: Priya already holds the laptop
  db.allocations.push({
    id: id('alc'),
    assetId: laptop.id,
    employeeId: priya.id,
    allocatedAt: new Date().toISOString(),
    expectedReturnDate: null,
    returnedAt: null,
    status: 'Active',
  });

  // Existing booking: Room B2 booked 09:00-10:00 today
  const today = new Date();
  today.setMinutes(0, 0, 0);
  const start = new Date(today);
  start.setHours(9, 0, 0, 0);
  const end = new Date(today);
  end.setHours(10, 0, 0, 0);
  db.bookings.push({
    id: id('bkg'),
    resourceId: roomB2.id,
    bookedBy: raj.id,
    start: start.toISOString(),
    end: end.toISOString(),
    status: 'Upcoming',
    createdAt: new Date().toISOString(),
  });
}

seed();

module.exports = { db, id, hashPassword, nextAssetTag };
