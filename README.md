# SanityFlow - Desktop QA Sanity Checklist Manager

**SanityFlow** is a production-quality, offline-first Desktop QA Sanity Checklist Manager built with **Electron**, **React 18**, **Vite**, **Tailwind CSS**, **SQLite** (`sql.js`), and **jsPDF**.

---

## Key Features

* **Offline-First SQLite Architecture**: All users, global templates, checklist sessions, and test items are persisted locally in SQLite (`sanityflow.sqlite`).
* **Local Authentication System**:
  * Username & password login with `bcrypt` hashed credentials.
  * Remember last login token.
  * Pre-seeded default QA tester account (`tester` / `password123`) and Registration tab.
* **Dashboard Overview**:
  * Real-time metrics (Total Projects, Today's Checklists, Sanity Pass Rate %, Executed Checks).
  * Quick action launch cards with desktop animations.
  * Recent Sanity Runs list with progress bars and instant PDF export.
* **Automated New Checklist Creation**:
  * Automatically fills current Date & Time.
  * User enters Project Name, Environment, and Tester Name.
  * Automatically clones all items from the **Global Template**.
* **Interactive Checklist Execution**:
  * Multi-state Checkboxes (Pass, Fail, Blocked, Pending) with **instant auto-save to SQLite**.
  * Inline remarks / defect notes editor.
  * Add custom ad-hoc checks directly to active sessions.
  * Bulk actions: "Pass All", "Reset All".
* **Screenshot Evidence Management**:
  * Drag-and-drop & native file picker upload.
  * Supports PNG / JPG up to 5 MB with strict file-size enforcement.
  * Files stored safely inside `uploads/screenshots/` with unique session-item timestamps; only file paths saved in SQLite.
  * Thumbnail preview + Replace + Delete.
  * Fullscreen **Lightbox Modal** with zoom controls and download.
* **Global Template Management (Settings)**:
  * Add new checklist item.
  * Inline rename and category assignment.
  * Delete checklist items.
  * Up/Down and reorder controls.
  * Reset to default standard QA sanity template.
  * Export & Import template JSON.
* **History & Search**:
  * Search by project name or tester.
  * Filter by specific date or execution status.
  * Open / Resume active sessions.
  * Edit project metadata.
  * **Duplicate Session** (clones entire checklist into a new test run).
  * Direct PDF export from history list.
* **Professional PDF Export**:
  * Branded QA Sanity Execution Report generated via `jsPDF` + `jspdf-autotable`.
  * Includes Project Name, Date, Time, Tester, Environment, Status pills, and Summary Stats.
  * Complete checklist items table with color-coded status badges and remarks.
  * Embedded screenshot evidence section with high-resolution images.
* **Modern Desktop UX**:
  * Dark Mode / Light Mode toggle with local persistence.
  * Keyboard Shortcuts (`Ctrl+N`, `Ctrl+H`, `Ctrl+T`, `Ctrl+D`, `Ctrl+P`, `Esc`, `?`).
  * Desktop toast notifications for auto-save and actions.

---

## Project Structure

```
d:/checklist generator/
├── electron/
│   ├── db/
│   │   └── database.js             # SQLite manager, schema migrations, seeds, CRUD operations
│   ├── services/
│   │   ├── screenshotService.js   # Screenshot storage in uploads/screenshots, max 5MB validation
│   │   └── pdfService.js          # jsPDF report generator with embedded screenshots
│   ├── main.js                    # Electron main process & IPC handlers
│   └── preload.js                 # contextBridge exposing secure window.api
├── src/
│   ├── components/
│   │   ├── Checklist/
│   │   │   ├── ChecklistItemRow.jsx     # Row with checkbox, status cycler, notes, screenshot
│   │   │   ├── ScreenshotUploader.jsx   # Drag-and-drop dropzone, replace/delete buttons
│   │   │   ├── ScreenshotModal.jsx      # Lightbox preview with zoom controls
│   │   │   └── StatusBadge.jsx          # Color-coded status pills
│   │   └── Layout/
│   │       ├── AppLayout.jsx            # Shell with shortcuts listener
│   │       ├── Sidebar.jsx              # Navigation & tester profile chip
│   │       ├── TitleBar.jsx             # Window controls & status badge
│   │       └── ShortcutsModal.jsx       # Keyboard shortcut help modal
│   ├── context/
│   │   ├── AuthContext.jsx              # Local auth provider with remember-me
│   │   ├── ThemeContext.jsx             # Dark / Light theme provider
│   │   └── ToastContext.jsx             # Toast notification alerts
│   ├── pages/
│   │   ├── LoginPage.jsx                # Login / Register tabs & demo access
│   │   ├── DashboardPage.jsx            # Overview cards & recent checklists
│   │   ├── NewChecklistPage.jsx         # Auto date/time & template preview
│   │   ├── ActiveChecklistPage.jsx      # Execution grid with auto-save
│   │   ├── HistoryPage.jsx              # Search, filter, duplicate & delete
│   │   └── SettingsPage.jsx             # Global template editor & JSON import/export
│   ├── App.jsx                          # Protected routing
│   ├── main.jsx                         # HashRouter & React root
│   └── index.css                        # Tailwind styles & glassmorphism
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Database Schema (SQLite)

### `Users`
* `id` INTEGER PRIMARY KEY AUTOINCREMENT
* `username` TEXT UNIQUE NOT NULL
* `password_hash` TEXT NOT NULL
* `full_name` TEXT
* `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
* `last_login_at` DATETIME

### `GlobalChecklist`
* `id` INTEGER PRIMARY KEY AUTOINCREMENT
* `name` TEXT NOT NULL
* `category` TEXT DEFAULT 'General'
* `order_no` INTEGER NOT NULL
* `default_notes` TEXT
* `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

### `ChecklistSessions`
* `id` INTEGER PRIMARY KEY AUTOINCREMENT
* `project_name` TEXT NOT NULL
* `tester_name` TEXT NOT NULL
* `environment` TEXT DEFAULT 'QA'
* `status` TEXT DEFAULT 'In Progress'
* `notes` TEXT
* `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
* `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP

### `ChecklistItems`
* `id` INTEGER PRIMARY KEY AUTOINCREMENT
* `session_id` INTEGER NOT NULL (FOREIGN KEY to ChecklistSessions)
* `item_name` TEXT NOT NULL
* `category` TEXT DEFAULT 'General'
* `status` TEXT DEFAULT 'pending' (pending, passed, failed, blocked, skipped)
* `screenshot_path` TEXT
* `notes` TEXT
* `order_no` INTEGER NOT NULL
* `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP

---

## Setup & Running Locally

### Prerequisites
* Node.js v18+ (tested on v20.19.0)
* npm v9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Vite + Electron)
```bash
npm run app:dev
```
Or start Vite dev server and Electron separately:
```bash
# Terminal 1:
npm run dev

# Terminal 2:
npm run start
```

### 3. Production Build
```bash
npm run build
npm start
```

---

## Default Login Credentials

* **Username**: `tester`
* **Password**: `password123`
* *(You can also register any new account using the "Register Tester" tab or click "One-Click Quick Login")*

---

## Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + N` | Create New Sanity Checklist |
| `Ctrl + H` | Open Checklist History |
| `Ctrl + T` | Open Global Template Settings |
| `Ctrl + D` | Go to Dashboard |
| `Ctrl + P` | Export Current Checklist to PDF |
| `Esc` | Close Modals & Lightbox Viewers |
| `?` or `Ctrl + /` | Open Keyboard Shortcuts Cheat Sheet |
