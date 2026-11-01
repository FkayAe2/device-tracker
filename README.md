# BPE Office Device Tracking System
> Developed for the ICT Unit of the **Bureau of Public Enterprises (BPE), Abuja**.

The BPE Office Device Tracking System is a modern, responsive web application designed for ICT officers to catalog, locate, update, monitor, and audit office devices (computers, laptops, printers, scanners, photocopiers, network appliances, and more) across all departments.

---

## 1. Quick Start & URLs

### Requirements
- **Node.js** v18+ (tested on Node v20)
- **npm** v9+

### Commands to Run
Open your terminal in the `device-tracker` folder and run:

```bash
# 1. Install all dependencies (root, backend, and frontend)
npm run setup

# 2. Start both the backend API (port 5000) and frontend UI (port 5173) together
npm run dev
```

### Application URLs
- **Web Interface:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 2. Seed Login Credentials

Two built-in user accounts are automatically created with secure bcrypt-hashed passwords upon first launch:

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@123` | Full access (View, Create, Edit, Delete, CSV Export) |
| **ICT Staff** | `staff` | `Staff@123` | Operational access (View, Create, Edit, CSV Export — *Delete blocked*) |

---

## 3. Step-by-Step Tour of the Application

### 1. Login Page (`/login`)
- Enter your username and password.
- Features quick "Click to fill Admin" and "Click to fill Staff" demo helper buttons.
- On login, a JWT token is generated and saved in local storage.

### 2. Dashboard (`/dashboard`)
- **Key Metrics Overview:** Total device count, devices in use, devices available, and devices needing attention.
- **Visual Analytics:**
  - Devices by Department (Bar Chart)
  - Devices by Status (Pie / Status breakdown)
  - Devices by Type (Computer, Laptop, Printer, Network, etc.)
- **Action Required List:** Quick table highlighting devices marked as `Faulty` or `Under Repair` for urgent maintenance.
- **Recent Activity Feed:** Live timeline showing the last 10 modifications across the system.

### 3. Device Directory (`/devices`)
- **Live Search:** Search instantly by device name, asset tag (e.g. `BPE-ICT-001`), serial number, or assignee.
- **Multi-Filter Bar:** Filter devices by Category/Type, Department, Physical Condition, and Status.
- **Sorting & Pagination:** Click on table headers to sort ascending or descending. Paginated at 20 devices per page.
- **CSV Export:** Click "Export CSV" to download the current filtered dataset with all columns formatted into `bpe_devices.csv`.

### 4. Adding a Device (`/devices/new`)
- Form fields include: Device Name, Unique Asset Tag, Device Type, Brand, Model, Serial Number, Department, Office Location, Assignee, Acquisition Date, Condition, Status, and Notes.
- Asset tags are strictly validated: duplicate asset tags are caught on both client and server (returns HTTP 409).
- Creating a device automatically appends a `CREATE` event to the audit trail.

### 5. Editing, Moving & Retiring a Device (`/devices/:id/edit`)
- Update any field (e.g. moving a laptop from one room to another, changing assignee, or setting status to `In Repair` or `Retired`).
- Every changed field is individually logged in the device's history with the previous value, new value, timestamp, and the user who modified it.

### 6. Device Detail & Audit Trail (`/devices/:id`)
- Displays all specifications and metadata for a device.
- Shows a chronological **History & Audit Log** answering:
  - *Who* changed the record?
  - *When* was it changed?
  - *What* was changed (e.g., location changed from `Office 201` to `Office 305`)?
- Delete button is accessible only to `admin` users (with a confirmation modal). Staff accounts receive an alert if an unauthorized delete request is made.

---

## 4. Architecture & Request Flow

### How the Parts Connect
```
[ Browser / React App ]  (Port 5173)
         │
         │  1. User clicks "Save Device"
         │  2. Axios attaches Authorization: Bearer <JWT>
         ▼
[ Vite Dev Proxy ] (/api/* -> http://localhost:5000)
         │
         ▼
[ Express Server ] (server.js, Port 5000)
         │
         ├── middleware/auth.js: Validates JWT signature & extracts user role
         │
         ├── routes/devices.js: Validates fields & checks unique asset tag
         │
         ▼
[ SQLite Database ] (better-sqlite3, data/devices.db)
         │
         ├── 1. INSERT INTO devices (...)
         └── 2. INSERT INTO history (device_id, action, field_name, ...)
         │
         ▼
[ Express Server ]
         │
         │  Returns HTTP 201 Created + JSON payload
         ▼
[ React Component ]
         │
         Displays success toast & updates UI state
```

### Main Files & Directory Structure
```
device-tracker/
├── package.json               # Root scripts (setup, dev using concurrently)
├── README.md                  # Complete documentation and beginner guide
├── backend/
│   ├── .env                   # Environment config (PORT=5000, JWT_SECRET)
│   ├── db.js                  # Database connection, tables creation, 20 seed records
│   ├── server.js              # Express app entry point & route registration
│   ├── middleware/
│   │   └── auth.js            # JWT verification & requireAdmin role guard
│   ├── routes/
│   │   ├── auth.js            # POST /api/auth/login endpoint
│   │   └── devices.js         # REST endpoints: CRUD, search, filter, CSV, stats
│   └── data/
│       └── devices.db         # Persistent SQLite database file
└── frontend/
    ├── vite.config.js         # Vite configuration with proxy to port 5000
    ├── index.html             # HTML entry point
    └── src/
        ├── api.js             # Axios instance with JWT interceptor & 401 handling
        ├── App.jsx            # React Router paths & protected route guard
        ├── index.css          # Green & White BPE professional design system
        ├── context/
        │   └── AuthContext.jsx# Authentication context (user, token, login, logout)
        ├── components/
        │   └── Layout.jsx     # Navigation sidebar, topbar, active route indicator
        └── pages/
            ├── LoginPage.jsx       # Login view with demo credentials
            ├── DashboardPage.jsx   # Charts, stats counters, needs-attention list
            ├── DevicesPage.jsx     # Table view with search, filter, CSV export
            ├── DeviceDetailPage.jsx# Device info view + full audit history
            └── DeviceFormPage.jsx  # Create and edit device form with validation
```

---

## 5. Database & Reset Instructions

All data is stored locally in an embedded SQLite database file located at:
```
backend/data/devices.db
```

### To Reset Data to Default Seeds:
1. Stop the application (`Ctrl + C` in the terminal).
2. Delete the `backend/data/devices.db` file (and any `-wal` / `-shm` temporary files).
3. Restart the server (`npm run dev`).
4. `db.js` will automatically re-create the tables and re-populate the 20 initial devices and user accounts.

---

## 6. Automated Tests & Verification Results

The automated test suite evaluated all core requirements against the live backend:
- ✅ **API Health Check (`GET /api/health`):** Returned HTTP 200 `status: "ok"`.
- ✅ **Authentication:**
  - Invalid credentials rejected with HTTP 401.
  - Admin login successful with role `admin`.
  - Staff login successful with role `staff`.
- ✅ **Dashboard Analytics:** Returned aggregate counts by status, condition, type, and department, plus devices needing attention.
- ✅ **Search & Filter:** Live substring queries and multi-filter parameters returned accurate results.
- ✅ **CSV Export:** Returned HTTP 200 with proper `text/csv` headers and escaped commas.
- ✅ **Device Creation & Validation:**
  - Created device with generated ID.
  - Duplicate asset tag attempt was rejected with HTTP 409 and descriptive error message.
- ✅ **Audit Logging:** Modifications recorded old vs. new values and user attribution in the `history` table.
- ✅ **Role-Based Access Control (RBAC):**
  - Staff account attempting `DELETE /api/devices/:id` rejected with HTTP 403 Forbidden.
  - Admin account successfully deleted the device with HTTP 200.
- ✅ **Production Build:** `npm run build` bundled all modules with zero compilation errors.

---

## 7. Future Improvement Ideas
- **QR Code / Barcode Generation:** Print QR asset tags directly from the device detail page for mobile scanning.
- **Automated Email / Push Alerts:** Notify the ICT maintenance team when a device condition is marked `Faulty`.
- **Maintenance Cost Tracking:** Add a maintenance expense ledger to each device for budgeting.
- **Bulk CSV Import:** Allow uploading CSV files to import multiple devices simultaneously.

