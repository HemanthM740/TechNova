# TechNova
Odoo hackathon
# AssetFlow — Enterprise Asset & Resource Management (Hackathon Build)

A working, scoped-down build of AssetFlow covering the core demo flows:
allocation conflict blocking, resource booking overlap validation,
maintenance approval workflow, and a live KPI dashboard — plus auth,
org setup, and the asset registry underneath them.

No database setup needed — the backend keeps everything in memory and
seeds itself with demo data every time it starts.

## Run it

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:4000** in your browser. The frontend is
served by the same backend, so there's nothing else to start.

## Seeded logins

| Role          | Email                    | Password      |
|---------------|--------------------------|---------------|
| Admin         | admin@assetflow.io       | admin123      |
| Asset Manager | manager@assetflow.io     | password123   |
| Employee      | priya@assetflow.io       | password123   |
| Employee      | raj@assetflow.io         | password123   |

Priya already holds **Laptop AF-0114** (asset tag `AF-0001`), and
**Room B2** already has a 09:00–10:00 booking today — both are seeded
specifically so you can demo the two centerpiece rules immediately.

## The two demo beats to rehearse

1. **Allocation conflict block** — log in as Admin or Asset Manager, go
   to **Allocations**, try to allocate `AF-0001` (the laptop) to Raj.
   It gets blocked with "currently held by Priya Sharma" and offers a
   transfer button instead.
2. **Booking overlap rejection** — go to **Bookings**, select Room B2,
   try booking 09:30–10:30 (rejected, overlaps the existing 09:00–10:00
   slot) then 10:00–11:00 (accepted, since it starts right after).

## Project structure — split for 4 people to push independently

Each person owns one vertical slice: a backend route file + its
matching frontend view file. Nobody edits the same file as anyone else.

```
backend/
  routes/
    auth.js          →  (Auth + roles)
    org.js            →  (Departments, Categories, Employee Directory)
    assets.js          → (Asset registry)
    allocations.js      →  (Allocation + transfer + conflict rule)
    bookings.js          →  (Resource booking + overlap rule)
    maintenance.js        →  (Maintenance workflow)
    dashboard.js            →  (KPI dashboard)
  middleware/auth.js  → shared, agree on this before splitting up
  db.js               → shared schema + seed data, agree on this first
  server.js           → shared, wires all routes together

frontend/js/
  auth.js       
  org.js         
  assets.js       
  allocations.js   
  bookings.js        
  maintenance.js      
  dashboard.js          
  api.js / main.js   → shared bootstrap, agree on this before splitting up
```

### Suggested workflow
1. Everyone pulls `main` with `db.js`, `middleware/auth.js`, `server.js`,
   and the `frontend/js/api.js` + `main.js` + `index.html` + `style.css`
   already in place (these are the shared contracts — don't change
   field names in `db.js` unilaterally).
2. Each person works on their own branch, touching only their route
   file(s) and matching frontend view file(s).
3. Merge branches back into `main` — since nobody touches the same
   files, merges should be conflict-free.
4. Reserve the last 10–15 minutes to run the app together, seed-check,
   and rehearse the two demo beats above before presenting.

## What's intentionally scoped out (2-hour cut)

- Audit Cycle screen
- Full Reports & Analytics (utilization trends, heatmaps)
- Real notification delivery (email/in-app) — statuses update live in
  the UI instead
- Photo/document uploads on assets and maintenance requests
- Transfer workflow's "Requested → Approved" intermediate state (the
  build does a direct, immediate re-allocation instead)
- Department hierarchy (parent department), category-specific dynamic
  fields, forgot-password flow

If asked, the answer is: "scoped out given time, but the architecture
(shared schema, per-module routes) supports adding them."
