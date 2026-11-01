# BPE ICT Office Device Tracking System
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/database-SQLite%203-blue.svg)](https://www.sqlite.org/)

A full-stack, enterprise-grade inventory management and asset auditing system built for the Information & Communications Technology (ICT) Unit of the **Bureau of Public Enterprises (BPE), Abuja, Nigeria**.

The system enables ICT administrators and officers to monitor, locate, audit, and manage government office hardware—including computers, laptops, printers, scanners, photocopiers, and core network appliances—across all six administrative departments with real-time audit trail tracking.

---

## 📌 Problem Statement & Objectives

### The Problem
Public enterprise departments often manage hundreds of high-value hardware assets across multiple floors, office suites, and staff assignments. Without a centralized, secure tracking platform, organizations suffer from:
- Lost or displaced hardware during department transfers.
- Inaccurate inventory logs and lack of accountability regarding *who* moved an asset and *when*.
- Delays in reporting and resolving faulty equipment (e.g. broken drum units, offline switches).
- Data loss from untracked asset retirements and disposals.

### Project Objectives
1. **Centralized Asset Registry:** Provide a single source of truth for all office IT hardware with 16 comprehensive data attributes per device.
2. **Immutable Audit Trail:** Automatically capture every status change, physical relocation, and assignee transfer in a granular history log.
3. **Role-Based Access Control (RBAC):** Strictly enforce administrative privileges on both client and server to prevent unauthorized asset deletions.
4. **Visual Analytics & Early Warnings:** Offer a high-level operational dashboard with categorized metrics and an urgent "Needs Attention" queue.
5. **Portability & Interoperability:** Allow live multi-criteria filtering and instant CSV export for reporting and auditing.

---

## 🚀 Live Demo & Screenshots

- **Frontend Application:** `http://localhost:5173` (or your production domain)
- **API Health Check:** `http://localhost:5000/api/health`

### Screenshots Overview
| Dashboard & Analytics | Device Management Directory |
|:---:|:---:|
| *Interactive KPI cards, department breakdowns, and attention queues* | *Live search, multi-field filters, sorting, and CSV export* |

| Audit Trail & Device Detail | Responsive Mobile Layout |
|:---:|:---:|
| *Field-by-field chronological modification logs* | *Fully adaptive mobile sidebar and table responsiveness* |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | Fast, responsive Single Page Application (SPA) architecture |
| **Routing** | React Router DOM v6 | Declarative client-side routing with protected route guards |
| **UI & Styling** | Vanilla CSS Design System | Custom, lightweight green & white theme (`#14532d` / `#16a34a`) |
| **Data Visualizations** | Recharts v2 | Responsive SVG bar charts and status distribution analytics |
| **Notifications** | React Hot Toast | Toast notifications for user feedback and error messages |
| **HTTP Client** | Axios | Configured with automatic JWT injection and 401 interceptor |
| **Backend Framework** | Node.js / Express.js | Modular RESTful API architecture |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Stateless token authorization with salted password hashing |
| **Database** | SQLite via `better-sqlite3` | High-performance, zero-latency synchronous embedded database |
| **Python Tooling** | Python 3.12 + ReportLab | Programmatic PDF documentation and formal user manual generator |

---

## 🔐 Seed Accounts & Access Control

Upon first startup, the database automatically initializes and creates two role-segregated accounts:

| Role | Username | Password | Access Rights |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@123` | Full access: View, Add, Edit, CSV Export, and **Delete** devices. |
| **ICT Staff** | `staff` | `Staff@123` | Operational access: View, Add, Edit, CSV Export. **Deletion is blocked on both UI and server.** |

*(The login screen also features 1-click helper buttons to quickly test either role).*

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- [npm](https://www.npmjs.com/) (version 9.0.0 or higher)
- [Python 3](https://www.python.org/) (optional, only needed for regenerating PDF documentation)

### 1. Clone the Repository
```bash
git clone https://github.com/FkayAe2/device-tracker.git
cd device-tracker
```

### 2. Install Dependencies
```bash
npm run setup
```
*(This command installs root dependencies like `concurrently`, followed by `backend` and `frontend` dependencies).*

### 3. Configure Environment Variables
Inside the `backend/` directory, copy the example file:
```bash
cp backend/.env.example backend/.env
```
Default parameters in `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=bpe_ict_device_tracker_super_secret_2024
```

### 4. Start the Development Servers
From the root project directory, run:
```bash
npm run dev
```
- Frontend UI opens at: **`http://localhost:5173`**
- Backend API listens at: **`http://localhost:5000`**

---

## 📦 Project Directory Structure

```text
device-tracker/
├── package.json                   # Root package with concurrently & setup scripts
├── README.md                      # Primary project overview and instructions
├── SYSTEM_ARCHITECTURE.md         # Deep-dive architecture and request flows
├── DATABASE_DESIGN.md             # Entity relationships, schema, and indexes
├── TECHNICAL_DOCUMENTATION.md     # Code-level guide for student defense
├── TESTING_REPORT.md              # Automated test suite and validation results
├── BPE_Device_Tracker_Guide.pdf   # Printable PDF quick reference guide
├── create_pdf.py                  # Python ReportLab script generating the PDF
├── backend/
│   ├── .env                       # Local environment variables (git-ignored)
│   ├── .env.example               # Template environment configuration
│   ├── package.json               # Backend dependencies (express, sqlite, etc.)
│   ├── server.js                  # Express application entry & CORS config
│   ├── db.js                      # Database connection, migrations & 20 seed items
│   ├── data/
│   │   └── devices.db             # Local SQLite database file (git-ignored)
│   ├── middleware/
│   │   └── auth.js                # JWT verification and requireAdmin role gate
│   └── routes/
│       ├── auth.js                # Authentication endpoint (POST /api/auth/login)
│       └── devices.js             # Device CRUD, search, filter, CSV, & stats
└── frontend/
    ├── package.json               # Frontend dependencies (react, recharts, etc.)
    ├── vite.config.js             # Vite configuration with proxy to port 5000
    ├── index.html                 # HTML application template
    └── src/
        ├── api.js                 # Axios instance with JWT interceptor & 401 handling
        ├── App.jsx                # Route hierarchy and protected route barrier
        ├── index.css              # Custom green-and-white enterprise CSS styling
        ├── main.jsx               # React DOM initialization
        ├── context/
        │   └── AuthContext.jsx    # User session state and login/logout handlers
        ├── components/
        │   └── Layout.jsx         # Sidebar navigation, top bar, and role badge
        └── pages/
            ├── LoginPage.jsx       # Authentication page with demo credentials
            ├── DashboardPage.jsx   # Metrics, Recharts visualization, attention list
            ├── DevicesPage.jsx     # Device inventory table, search, filters, CSV
            ├── DeviceDetailPage.jsx# Full hardware specifications & audit timeline
            └── DeviceFormPage.jsx  # Create and update hardware records
```

---

## 🌐 Public Deployment Guide (Railway / Render / VPS)

### Option A: Full-Stack Single-Container Deployment (Recommended)
Because `backend/server.js` automatically serves the built frontend files (`frontend/dist`) when they exist, you can deploy the entire repository as a single service on **Railway** or **Render**:

1. **Build Step:**
   ```bash
   npm run setup && npm run build
   ```
2. **Start Command:**
   ```bash
   npm run start:prod
   ```
3. **Environment Variables to set in host dashboard:**
   - `NODE_ENV=production`
   - `PORT=5000` (or host assigned `$PORT`)
   - `JWT_SECRET=<generate_a_random_32_byte_string>`
   - `CLIENT_URL=https://your-custom-domain.com`

### Option B: Connecting a Custom Domain
1. In your deployment provider (e.g., Railway, Render, or Vercel), navigate to **Settings > Custom Domains**.
2. Enter your custom domain (e.g. `tracker.yourdomain.com`).
3. Add the provided `CNAME` or `A` DNS records in your DNS management dashboard (e.g., Cloudflare, Namecheap, GoDaddy).
4. SSL certificates are provisioned automatically via Let's Encrypt.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
