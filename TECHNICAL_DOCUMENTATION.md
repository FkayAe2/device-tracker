# Technical Documentation & Student Defense Guide

> **Target Audience:** Software Engineering Students, Technical Interviewers, and Academic Evaluators.  
> **Purpose:** Detailed conceptual and implementation guide to thoroughly understand, explain, and defend the design choices and engineering architecture of the BPE Office Device Tracker.

---

## 1. Executive Summary & Architecture Overview

The system is designed following the **Client-Server Architecture** utilizing a **Single Page Application (SPA)** decoupled from a **RESTful API Service** backed by an **Embedded Relational Database**.

```
[ Frontend: React (Vite) ] <--- HTTP REST API (JSON) ---> [ Backend: Express (Node.js) ] <---> [ Database: SQLite ]
            │                                                                                         ▲
            │                                                                                         │
            └───────────────────────── Python Engine (ReportLab) ─────────────────────────────────────┘
```

---

## 2. Frontend Engineering (React 18 + Vite)

### How React is Used
React is a declarative, component-based user interface library. In this application:
1. **Component Hierarchy:** The UI is broken into modular, reusable components:
   - **`Layout.jsx`**: Acts as the master wrapper (shell), rendering the fixed green sidebar, responsive navigation links, user profile badge, and the main dynamic content container (`<Outlet />`).
   - **`Pages`**: Specific route views (`DashboardPage`, `DevicesPage`, `DeviceDetailPage`, `DeviceFormPage`, `LoginPage`).
2. **State Management (`useState`, `useEffect`):**
   - Local component states handle search inputs, active filter dropdowns, and pagination indicators.
   - `useEffect` hooks trigger HTTP fetch requests whenever dependencies change (e.g., when the user selects a new department or types a search query).
3. **Global Authentication Context (`useAuth` Hook):**
   - Managed in `context/AuthContext.jsx`.
   - Stores the current user object and JWT token in React state, synchronized with browser `localStorage`.
   - Exposes helper functions (`login`, `logout`) and flags (`isAdmin`) throughout the component tree.
4. **Declarative Client-Side Routing (React Router v6):**
   - Prevents page flickering.
   - Protected Route Pattern: The `<ProtectedRoute>` component evaluates whether a valid token exists; if absent, it issues an immediate `<Navigate to="/login" replace />`.

---

## 3. Backend Architecture (Node.js + Express.js)

### How the Backend Processes Requests
Every HTTP request follows a deterministic pipeline through Express middleware before reaching route handlers:

1. **JSON Body Parsing:** `express.json()` reads the raw incoming request stream and transforms JSON bodies into accessible `req.body` objects.
2. **Cross-Origin Resource Sharing (CORS):** The CORS middleware inspects `req.headers.origin`. If the origin matches permitted domains (`localhost` or production `CLIENT_URL`), it sets appropriate `Access-Control-Allow-Origin` headers.
3. **Authentication Barrier (`middleware/auth.js`):**
   - Extracts the `Authorization: Bearer <token>` header.
   - Verifies the cryptographic signature of the token against `process.env.JWT_SECRET`.
   - Decodes payload `{ id, username, role }` and attaches it directly to `req.user`.
4. **Role Gate (`requireAdmin`):**
   - For destructive operations like `DELETE /api/devices/:id`, the middleware verifies `if (req.user.role !== 'admin')`.
   - If a standard staff user attempts the request, the backend immediately returns `403 Forbidden` without touching the database.

---

## 4. Authentication Mechanism (Stateless JWT + Bcrypt)

### How Authentication Works Under the Hood
1. **Password Storage:** Passwords are never stored in plain text. When users are seeded or created, `bcrypt.hashSync(password, 10)` generates a salted, one-way hash.
2. **Login Verification:**
   - User submits username and password via `POST /api/auth/login`.
   - The server queries `SELECT * FROM users WHERE username = ?`.
   - `bcrypt.compareSync(password, user.password)` cryptographically validates the password against the stored hash.
3. **Token Generation:**
   - On match, `jwt.sign()` generates a signed JSON Web Token containing the user's ID, username, and role, set to expire in 8 hours.
   - The token is returned to the client and stored in `localStorage`.
4. **Stateless Scalability:** Because the token is signed with a secret key, the server does not need to maintain server-side session tables in memory. Every request proves its identity through its cryptographic signature.

---

## 5. Database Engineering & CRUD Operations

### How CRUD Works with SQLite & better-sqlite3

#### Create (Insert)
- Route: `POST /api/devices`
- Validates that mandatory fields (`device_name`, `asset_tag`, `department`, `device_type`) are present.
- Executes an initial check: `SELECT id FROM devices WHERE asset_tag = ?`. If an asset tag exists, returns `409 Conflict`.
- Executes parameterized `INSERT INTO devices (...) VALUES (?, ?, ...)`.
- Automatically appends a `CREATE` record to the `history` audit table.

#### Read (Select, Search, Filter, Sort, Paginate)
- Route: `GET /api/devices`
- Dynamically constructs a parameterized SQL query:
  ```sql
  SELECT * FROM devices WHERE 1=1 
    AND (device_name LIKE ? OR asset_tag LIKE ? OR serial_number LIKE ? OR assigned_to LIKE ?)
    AND department = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  ```
- Uses parameterized placeholders (`?`) for every user-supplied input, eliminating SQL Injection vulnerabilities.

#### Update (Edit & Relocate)
- Route: `PUT /api/devices/:id`
- Compares each incoming field with existing database values.
- If a value has changed (e.g., `location` changed from "Office 101" to "Office 205"), an audit record is inserted into the `history` table tracking the old value, new value, timestamp, and user.
- Executes `UPDATE devices SET ..., updated_at = datetime('now') WHERE id = ?`.

#### Delete (Prune)
- Route: `DELETE /api/devices/:id`
- Guarded by `requireAdmin` middleware.
- Foreign key rules (`ON DELETE CASCADE`) ensure all child audit records in `history` are cleanly removed without leaving orphaned rows.

---

## 6. How the Python Component Contributes

The application includes `create_pdf.py` powered by **Python 3.12 and ReportLab**.
- **Role:** Demonstrates multi-language integration where Python handles document compilation while JavaScript handles real-time web delivery.
- **Functionality:** Reads system structures and builds a vector PDF document (`BPE_Device_Tracker_Guide.pdf`) complete with typography, tables, and color-coded badges for printable office compliance.

---

## 7. Key Student Defense Questions & Answers

### Q1: "Why did you choose SQLite over MySQL or PostgreSQL?"
> **Answer:**  
> "For an internal agency tool managing physical office hardware (hundreds to thousands of records), SQLite offers superior operational simplicity. It is an embedded, zero-configuration database that resides directly in the repository directory, eliminating external network latency and database hosting costs. Furthermore, by utilizing `better-sqlite3` in WAL (Write-Ahead Logging) mode, queries run synchronously in C++ bindings, offering microsecond-level query execution."

### Q2: "How do you protect the system against SQL Injection and XSS?"
> **Answer:**  
> "All database interactions strictly use prepared statements with parameterized inputs (`?`), ensuring user inputs are treated as literal values rather than executable SQL syntax. On the frontend, React inherently sanitizes variables before injecting them into the DOM, preventing Cross-Site Scripting (XSS)."

### Q3: "What prevents a standard staff member from deleting a device using Postman or curl?"
> **Answer:**  
> "Security is enforced at the server layer, not just by hiding the button in the UI. The Express endpoint `DELETE /api/devices/:id` passes through the `requireAdmin` middleware. Even if an attacker captures a valid JWT from a staff member and sends a direct DELETE request via curl, the server inspects `req.user.role`, rejects the request, and immediately returns HTTP 403 Forbidden."

### Q4: "How does the audit trail work when moving a device?"
> **Answer:**  
> "When a `PUT` request is received, the backend retrieves the current device row and iterates through the incoming attributes. If an attribute differs from the database value, an entry is written into the `history` table recording the device ID, field name, previous value, new value, the username extracted from the JWT token, and the current timestamp."
