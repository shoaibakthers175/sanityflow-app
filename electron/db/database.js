const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.SQL = null;
    this.isInitialized = false;
  }

  async initialize(customStoragePath) {
    if (this.isInitialized && this.db) return;

    this.SQL = await initSqlJs();
    
    // Determine database directory and file path
    const storageDir = customStoragePath || path.join(__dirname, '../../data');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.dbPath = path.join(storageDir, 'sanityflow.sqlite');

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(fileBuffer);
        console.log('[DB] Loaded existing SQLite database from:', this.dbPath);
      } catch (err) {
        console.error('[DB] Error loading existing DB, creating new:', err);
        this.db = new this.SQL.Database();
      }
    } else {
      console.log('[DB] Creating brand new SQLite database at:', this.dbPath);
      this.db = new this.SQL.Database();
    }

    this.createTables();
    this.seedInitialData();
    this.saveToDisk();
    this.isInitialized = true;
  }

  saveToDisk() {
    if (!this.db || !this.dbPath) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[DB] Failed to save DB to disk:', err);
    }
  }

  createTables() {
    // Users table with role and vertical
    this.db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'tester',
        vertical TEXT DEFAULT 'acquisition',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      );
    `);

    // University Templates Table with vertical tagging
    this.db.run(`
      CREATE TABLE IF NOT EXISTS UniversityTemplates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        guidelines TEXT,
        vertical TEXT DEFAULT 'all',
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Template Sections (Headers) Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS TemplateSections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        order_no INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES UniversityTemplates(id) ON DELETE CASCADE
      );
    `);

    // Global checklist items Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS GlobalChecklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL DEFAULT 1,
        section_id INTEGER,
        section_title TEXT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        order_no INTEGER NOT NULL,
        default_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Checklist sessions table with vertical tagging
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ChecklistSessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        university_name TEXT DEFAULT 'Standard QA Sanity Suite',
        template_id INTEGER DEFAULT 1,
        tester_name TEXT NOT NULL,
        environment TEXT DEFAULT 'QA',
        status TEXT DEFAULT 'In Progress',
        vertical TEXT DEFAULT 'acquisition',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Checklist items table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ChecklistItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        section_title TEXT DEFAULT 'General',
        item_name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        status TEXT DEFAULT 'pending',
        screenshot_path TEXT,
        notes TEXT,
        order_no INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES ChecklistSessions(id) ON DELETE CASCADE
      );
    `);

    // App Preferences
    this.db.run(`
      CREATE TABLE IF NOT EXISTS AppPreferences (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Safe Migrations for existing databases
    try { this.db.run("ALTER TABLE Users ADD COLUMN role TEXT DEFAULT 'tester'"); } catch (e) {}
    try { this.db.run("ALTER TABLE Users ADD COLUMN vertical TEXT DEFAULT 'acquisition'"); } catch (e) {}
    try { this.db.run("ALTER TABLE UniversityTemplates ADD COLUMN vertical TEXT DEFAULT 'all'"); } catch (e) {}
    try { this.db.run("ALTER TABLE ChecklistSessions ADD COLUMN vertical TEXT DEFAULT 'acquisition'"); } catch (e) {}
    try { this.db.run("ALTER TABLE UniversityTemplates ADD COLUMN guidelines TEXT"); } catch (e) {}
    try { this.db.run("ALTER TABLE GlobalChecklist ADD COLUMN template_id INTEGER DEFAULT 1"); } catch (e) {}
    try { this.db.run("ALTER TABLE GlobalChecklist ADD COLUMN section_id INTEGER"); } catch (e) {}
    try { this.db.run("ALTER TABLE GlobalChecklist ADD COLUMN section_title TEXT"); } catch (e) {}
    try { this.db.run("ALTER TABLE ChecklistSessions ADD COLUMN university_name TEXT DEFAULT 'Standard QA Sanity Suite'"); } catch (e) {}
    try { this.db.run("ALTER TABLE ChecklistSessions ADD COLUMN template_id INTEGER DEFAULT 1"); } catch (e) {}
    try { this.db.run("ALTER TABLE ChecklistItems ADD COLUMN section_title TEXT DEFAULT 'General'"); } catch (e) {}
  }

  seedInitialData() {
    // Seed default isolated users for each vertical + Super Admin
    const defaultUsers = [
      { username: 'admin', password: 'admin123', full_name: 'System Administrator', role: 'admin', vertical: 'all' },
      { username: 'acq_user', password: 'acq123', full_name: 'Acquisition QA Lead', role: 'tester', vertical: 'acquisition' },
      { username: 'lms_user', password: 'lms123', full_name: 'LMS QA Lead', role: 'tester', vertical: 'lms' },
      { username: 'exam_user', password: 'exam123', full_name: 'Exam Portal QA Lead', role: 'tester', vertical: 'exam-portal' },
      { username: 'erp_user', password: 'erp123', full_name: 'ERP QA Lead', role: 'tester', vertical: 'erp' }
    ];

    defaultUsers.forEach(u => {
      const checkStmt = this.db.prepare("SELECT id FROM Users WHERE LOWER(username) = LOWER(?)");
      checkStmt.bind([u.username]);
      if (!checkStmt.step()) {
        const passHash = bcrypt.hashSync(u.password, 10);
        const insertUser = this.db.prepare(
          "INSERT INTO Users (username, password_hash, full_name, role, vertical, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
        );
        insertUser.run([u.username, passHash, u.full_name, u.role, u.vertical]);
        insertUser.free();
        console.log(`[DB] Seeded user: ${u.username} (${u.vertical})`);
      }
      checkStmt.free();
    });

    // Seed University Templates if none exists
    const tmplCountStmt = this.db.prepare("SELECT COUNT(*) as count FROM UniversityTemplates");
    tmplCountStmt.step();
    const tmplCount = tmplCountStmt.getAsObject().count;
    tmplCountStmt.free();

    if (tmplCount === 0) {
      this.seedUniversityTemplates();
    } else {
      // Migration: Ensure any legacy 'all' templates are cleaned up so each vertical has its own
      const allStmt = this.db.prepare("SELECT id FROM UniversityTemplates WHERE LOWER(vertical) = 'all'");
      const legacyAllIds = [];
      while (allStmt.step()) {
        legacyAllIds.push(allStmt.getAsObject().id);
      }
      allStmt.free();
      if (legacyAllIds.length > 0) {
        legacyAllIds.forEach(id => {
          this.db.run("DELETE FROM GlobalChecklist WHERE template_id = ?", [id]);
          this.db.run("DELETE FROM TemplateSections WHERE template_id = ?", [id]);
          this.db.run("DELETE FROM UniversityTemplates WHERE id = ?", [id]);
        });
        // Ensure each vertical has at least one template
        ['acquisition', 'lms', 'exam-portal', 'erp'].forEach(v => {
          const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM UniversityTemplates WHERE LOWER(vertical) = LOWER(?)");
          countStmt.bind([v]);
          countStmt.step();
          const count = countStmt.getAsObject().count;
          countStmt.free();
          if (count === 0) {
            this.seedUniversityTemplatesForVertical(v);
          }
        });
      }
    }
  }

  seedTemplateRecord(t) {
    const guidelinesStr = typeof t.guidelines === 'object' ? JSON.stringify(t.guidelines) : (t.guidelines || '');
    const insertTmpl = this.db.prepare("INSERT INTO UniversityTemplates (name, description, guidelines, vertical, is_default) VALUES (?, ?, ?, ?, ?)");
    insertTmpl.run([t.name, t.description, guidelinesStr, t.vertical, t.is_default ? 1 : 0]);
    insertTmpl.free();

    const tmplId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    (t.sections || []).forEach((s, sIdx) => {
      const insertSec = this.db.prepare("INSERT INTO TemplateSections (template_id, title, order_no) VALUES (?, ?, ?)");
      insertSec.run([tmplId, s.title, s.order_no || (sIdx + 1)]);
      insertSec.free();

      const secId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

      (s.items || []).forEach((item, itemIdx) => {
        const insertItem = this.db.prepare(
          "INSERT INTO GlobalChecklist (template_id, section_id, section_title, name, category, order_no, default_notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        insertItem.run([tmplId, secId, s.title, item.name, s.title, item.order_no || (itemIdx + 1), item.default_notes || '']);
        insertItem.free();
      });
    });

    return tmplId;
  }

  seedUniversityTemplates() {
    const VERTICAL_DEFAULTS = this.getDefaultTemplatesMap();
    Object.values(VERTICAL_DEFAULTS).forEach(t => {
      this.seedTemplateRecord(t);
    });
    console.log('[DB] Seeded strictly isolated templates for all 4 verticals');
  }

  seedUniversityTemplatesForVertical(vertical) {
    const VERTICAL_DEFAULTS = this.getDefaultTemplatesMap();
    const t = VERTICAL_DEFAULTS[vertical.toLowerCase()];
    if (t) {
      this.seedTemplateRecord(t);
      console.log(`[DB] Seeded default template for vertical: ${vertical}`);
    }
  }

  getDefaultTemplatesMap() {
    return {
      acquisition: {
        name: 'Acquisition Lead Funnel & CRM Sanity Suite',
        description: 'Admissions landing pages, student inquiry capture, CRM lead sync, and payment gateway checks',
        vertical: 'acquisition',
        is_default: 1,
        guidelines: {
          devUrl: 'https://dev.admissions.portal.com',
          venusUrl: 'https://venus.admissions.portal.com',
          prodUrl: 'https://admissions.portal.com',
          stagingUrl: 'https://venus.admissions.portal.com',
          vpnRequired: false,
          vpnNotes: 'No VPN required for cloud acquisition environments.',
          testAccounts: [
            { role: 'Prospective Student Applicant', username: 'applicant_test@example.com', password: 'TestAcqPass#2026', notes: 'Fresh applicant profile' },
            { role: 'Admissions Tele-Counsellor', username: 'counsellor_lead@admissions.com', password: 'Counsellor#2026', notes: 'Lead qualification access' },
            { role: 'Acquisition Marketing Admin', username: 'acq_admin@university.edu', password: 'AdminMaster#2026', notes: 'Campaign management and UTM logs' }
          ],
          prerequisites: [
            'Verify Facebook / Google UTM tracking parameters are preserved in sessionStorage.',
            'Ensure Webhook listener for CRM lead ingestion is healthy.',
            'Ensure Stripe & Razorpay sandbox payment gateways are in Test mode.'
          ],
          importantNotes: '⚠️ Do not submit test credit card data on live production URL. Verify webhook response 200 OK.'
        },
        sections: [
          {
            title: 'Lead Capture & Inquiry Forms',
            order_no: 1,
            items: [
              { name: 'Student Inquiry Form Submission & Field Validations', default_notes: 'Verify email and phone format' },
              { name: 'UTM Campaign & Referrer Parameter Capture', default_notes: 'Check session parameters in payload' },
              { name: 'Lead Deduplication & Spam Captcha Verification', default_notes: 'Verify duplicate submission prevention' }
            ]
          },
          {
            title: 'CRM Lead Ingestion & Notifications',
            order_no: 2,
            items: [
              { name: 'Instant CRM Lead Sync via Webhook Payload', default_notes: 'Check lead record created in CRM' },
              { name: 'Automated Welcome Email & SMS Dispatch', default_notes: 'Verify OTP & transactional email trigger' },
              { name: 'Counselor Round-Robin Lead Assignment', default_notes: 'Verify lead routing rule' }
            ]
          },
          {
            title: 'Application & Payment Gateway',
            order_no: 3,
            items: [
              { name: 'Online Application Fee Checkout (Stripe / Razorpay)', default_notes: 'Test 3D Secure test card' },
              { name: 'Fee Receipt Generation & Download Link', default_notes: 'Verify PDF receipt and invoice number' },
              { name: 'Application Status Tracker Dashboard', default_notes: 'Verify status updates from Submitted to Under Review' }
            ]
          }
        ]
      },
      lms: {
        name: 'LMS Course Player & Video Streaming Sanity Suite',
        description: 'Course catalog, video player streaming, student assignments, quiz engine, and discussion boards',
        vertical: 'lms',
        is_default: 1,
        guidelines: {
          devUrl: 'https://dev.lms.learningsuite.com',
          venusUrl: 'https://venus.lms.learningsuite.com',
          prodUrl: 'https://lms.learningsuite.com',
          stagingUrl: 'https://venus.lms.learningsuite.com',
          vpnRequired: false,
          vpnNotes: 'No VPN needed. High-speed connection recommended for video stream testing.',
          testAccounts: [
            { role: 'Enrolled Student', username: 'student_lms_01@learningsuite.com', password: 'LmsStudent#2026', notes: 'Enrolled in 3 courses' },
            { role: 'Course Instructor / Faculty', username: 'faculty_math@learningsuite.com', password: 'FacultyPass#2026', notes: 'Course creator and grading access' },
            { role: 'LMS Administrator', username: 'lms_admin@learningsuite.com', password: 'AdminMaster#2026', notes: 'SCORM and course publisher rights' }
          ],
          prerequisites: [
            'Ensure AWS CloudFront / HLS video streaming CDN endpoint is reachable.',
            'Confirm test assignment submission bucket has write permissions.',
            'Check that SCORM 1.2 / 2004 package player is loaded without iframe CORS errors.'
          ],
          importantNotes: '⚠️ Test video playback across 360p, 720p, and 1080p bitrates.'
        },
        sections: [
          {
            title: 'Course Catalog & Enrollment',
            order_no: 1,
            items: [
              { name: 'Course Search, Filter by Subject & Self-Enrollment', default_notes: 'Verify instant course unlock' },
              { name: 'Prerequisite Course Completion Lock & Enforcement', default_notes: 'Verify locked module alerts' },
              { name: 'Course Syllabus, Overview & Downloadable Resources', default_notes: 'Check asset download links' }
            ]
          },
          {
            title: 'Lecture Player & Video Streaming',
            order_no: 2,
            items: [
              { name: 'Adaptive Bitrate HLS / MP4 Video Playback & Seeking', default_notes: 'Test 1.25x, 1.5x, 2.0x playback rates' },
              { name: 'Subtitle / Closed Captions Multi-Language Toggle', default_notes: 'Verify English and Spanish captions' },
              { name: 'Lesson Progress Auto-Save & Resume Playback Timestamp', default_notes: 'Refresh page and check resume point' }
            ]
          },
          {
            title: 'Assignments, Quizzes & Gradebook',
            order_no: 3,
            items: [
              { name: 'Assignment File Upload (PDF, DOCX up to 25MB)', default_notes: 'Verify upload progress bar' },
              { name: 'Interactive Quiz Engine & Auto-Graded Multiple Choice', default_notes: 'Check score calculation' },
              { name: 'Faculty Gradebook Review, Feedback & Certificate Generator', default_notes: 'Verify completion certificate PDF' }
            ]
          }
        ]
      },
      'exam-portal': {
        name: 'Exam Portal Remote Proctoring Sanity Suite',
        description: 'Secure examination environment, AI webcam proctoring, timed question delivery, and auto-submit',
        vertical: 'exam-portal',
        is_default: 1,
        guidelines: {
          devUrl: 'https://dev.exam-portal.securetest.com',
          venusUrl: 'https://venus.exam-portal.securetest.com',
          prodUrl: 'https://exam-portal.securetest.com',
          stagingUrl: 'https://venus.exam-portal.securetest.com',
          vpnRequired: true,
          vpnNotes: 'Connect to Exam-Secure-VPN (vpn.securetest.com) for proctoring test server access.',
          testAccounts: [
            { role: 'Registered Candidate', username: 'candidate_hall_01@securetest.com', password: 'ExamPass#2026', notes: 'Scheduled for Mid-Term Examination' },
            { role: 'Live Invigilator / Proctor', username: 'proctor_lead@securetest.com', password: 'ProctorLead#2026', notes: 'Live video feed monitoring access' },
            { role: 'Exam Controller Admin', username: 'controller_exams@securetest.com', password: 'AdminMaster#2026', notes: 'Question bank & unlock passkeys' }
          ],
          prerequisites: [
            'Allow Browser Camera and Microphone permissions.',
            'Ensure Fullscreen API and Lock Screen mode are functional.',
            'Confirm WebSocket connection to proctoring server is established.'
          ],
          importantNotes: '⚠️ Tab-switch counter should trigger immediate warning overlay upon loss of window focus.'
        },
        sections: [
          {
            title: 'Candidate Authentication & Proctoring Setup',
            order_no: 1,
            items: [
              { name: 'Candidate Hall Ticket Verification & Biometric / Photo Match', default_notes: 'Check webcam photo snapshot' },
              { name: 'Hardware Diagnostic Check (Camera, Mic, Network Speed)', default_notes: 'Verify all 3 pass green checks' },
              { name: 'Fullscreen Lock & Multi-Monitor Screen Share Prevention', default_notes: 'Verify dual screen is blocked' }
            ]
          },
          {
            title: 'Timed Examination & Question Delivery',
            order_no: 2,
            items: [
              { name: 'Question Palette Navigation (Answered, Marked, Unvisited)', default_notes: 'Check color coded indicators' },
              { name: 'Instant Response Auto-Save on Selection (Offline Buffer)', default_notes: 'Verify no data loss on latency spike' },
              { name: 'Section Countdown Timer & 5-Minute Warning Toast', default_notes: 'Check timer sync with server clock' }
            ]
          },
          {
            title: 'Anti-Cheating Logs & Auto-Submission',
            order_no: 3,
            items: [
              { name: 'Tab-Switch & Background App Detection Alert', default_notes: 'Verify warning strike logged' },
              { name: 'Periodic Background Webcam Snapshot Interval', default_notes: 'Verify snapshots stored in evidence log' },
              { name: 'Auto-Submit on Timer Expiry & Encrypted Response Receipt', default_notes: 'Verify final confirmation hash' }
            ]
          }
        ]
      },
      erp: {
        name: 'ERP Student Lifecycle & Fee Ledger Sanity Suite',
        description: 'Student records, tuition fee accounting, faculty timetable allocation, and transcript generation',
        vertical: 'erp',
        is_default: 1,
        guidelines: {
          devUrl: 'https://dev.erp.universitysystem.com',
          venusUrl: 'https://venus.erp.universitysystem.com',
          prodUrl: 'https://erp.universitysystem.com',
          stagingUrl: 'https://venus.erp.universitysystem.com',
          vpnRequired: true,
          vpnNotes: 'Requires Administrative System VPN profile (erp-vpn.universitysystem.com).',
          testAccounts: [
            { role: 'Registrar Staff', username: 'registrar_staff@universitysystem.com', password: 'ErpStaff#2026', notes: 'Student record and transcript manager' },
            { role: 'Finance / Bursar Officer', username: 'bursar_finance@universitysystem.com', password: 'BursarLedger#2026', notes: 'Fee collection & ledger access' },
            { role: 'ERP Super Administrator', username: 'erp_admin@universitysystem.com', password: 'AdminMaster#2026', notes: 'Full ERP system privileges' }
          ],
          prerequisites: [
            'Verify Oracle / PostgreSQL DB replica sync is within 5 seconds.',
            'Check that financial ledger balance validation trigger is enabled.',
            'Ensure batch PDF transcript generator engine is running.'
          ],
          importantNotes: '⚠️ Always verify ledger debit and credit entries balance to 0.00 after fee settlement.'
        },
        sections: [
          {
            title: 'Student Information & Lifecycle',
            order_no: 1,
            items: [
              { name: 'Student Master Profile & KYC Document Verification', default_notes: 'Check personal & guardian data' },
              { name: 'Semester Term Enrollment & Department Allocation', default_notes: 'Verify batch student promotion' },
              { name: 'Major, Minor & Elective Course Allocation Rules', default_notes: 'Check capacity limit enforcement' }
            ]
          },
          {
            title: 'Fee Accounting & Bursary Ledger',
            order_no: 2,
            items: [
              { name: 'Tuition, Hostel & Lab Fee Structure Calculation', default_notes: 'Verify category & scholarship discounts' },
              { name: 'Installment Payment Schedule & Late Fee Penalty Calculation', default_notes: 'Check grace period logic' },
              { name: 'Double-Entry Bursary Ledger Balancing & Audit Trail', default_notes: 'Verify debit matches credit' }
            ]
          },
          {
            title: 'Academics, Timetable & Transcripts',
            order_no: 3,
            items: [
              { name: 'Conflict-Free Faculty & Classroom Timetable Generation', default_notes: 'Verify 0 room schedule clashes' },
              { name: 'Semester GPA / CGPA Calculation & Grade Moderation', default_notes: 'Check formula & rounding rules' },
              { name: 'Official Encrypted Transcript PDF & QR Code Verification', default_notes: 'Scan QR code to verify authenticity' }
            ]
          }
        ]
      }
    };
  }

  // --- USER & AUTH METHODS ---
  async loginUser(username, password) {
    const stmt = this.db.prepare("SELECT * FROM Users WHERE LOWER(username) = LOWER(?)");
    stmt.bind([username.trim()]);
    
    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      const match = bcrypt.compareSync(password, user.password_hash);
      if (match) {
        const updateLogin = this.db.prepare("UPDATE Users SET last_login_at = datetime('now') WHERE id = ?");
        updateLogin.run([user.id]);
        updateLogin.free();
        this.saveToDisk();

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role || 'tester',
            vertical: user.vertical || 'acquisition',
            last_login_at: user.last_login_at
          }
        };
      }
      return { success: false, message: 'Invalid username or password' };
    }
    stmt.free();
    return { success: false, message: 'User not found' };
  }

  // Admin-Only User Management
  getAllUsers() {
    const stmt = this.db.prepare("SELECT id, username, full_name, role, vertical, created_at, last_login_at FROM Users ORDER BY id ASC");
    const users = [];
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();
    return users;
  }

  createUser(username, password, fullName, role = 'tester', vertical = 'acquisition') {
    if (!username || !password) {
      return { success: false, message: 'Username and password are required' };
    }
    const checkStmt = this.db.prepare("SELECT id FROM Users WHERE LOWER(username) = LOWER(?)");
    checkStmt.bind([username.trim()]);
    if (checkStmt.step()) {
      checkStmt.free();
      return { success: false, message: 'Username is already taken' };
    }
    checkStmt.free();

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertStmt = this.db.prepare(
      "INSERT INTO Users (username, password_hash, full_name, role, vertical, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    );
    insertStmt.run([username.trim(), passwordHash, fullName || username, role, vertical]);
    insertStmt.free();

    const lastId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    this.saveToDisk();

    return {
      success: true,
      user: {
        id: lastId,
        username: username.trim(),
        full_name: fullName || username,
        role,
        vertical
      }
    };
  }

  updateUser(id, data) {
    const fields = [];
    const params = [];
    if (data.full_name !== undefined) {
      fields.push("full_name = ?");
      params.push(data.full_name);
    }
    if (data.role !== undefined) {
      fields.push("role = ?");
      params.push(data.role);
    }
    if (data.vertical !== undefined) {
      fields.push("vertical = ?");
      params.push(data.vertical);
    }
    if (data.password && data.password.trim()) {
      fields.push("password_hash = ?");
      params.push(bcrypt.hashSync(data.password.trim(), 10));
    }
    if (fields.length === 0) return true;

    params.push(id);
    const sql = `UPDATE Users SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(params);
    stmt.free();
    this.saveToDisk();
    return true;
  }

  deleteUser(id) {
    // Protect admin if it's the only admin
    const checkStmt = this.db.prepare("SELECT role FROM Users WHERE id = ?");
    checkStmt.bind([id]);
    if (checkStmt.step()) {
      const user = checkStmt.getAsObject();
      checkStmt.free();
      if (user.role === 'admin') {
        const adminCountStmt = this.db.prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'admin'");
        adminCountStmt.step();
        const adminCount = adminCountStmt.getAsObject().count;
        adminCountStmt.free();
        if (adminCount <= 1) {
          return { success: false, message: 'Cannot delete the only administrator account' };
        }
      }
    } else {
      checkStmt.free();
      return { success: false, message: 'User not found' };
    }

    const delStmt = this.db.prepare("DELETE FROM Users WHERE id = ?");
    delStmt.run([id]);
    delStmt.free();
    this.saveToDisk();
    return { success: true };
  }

  // Legacy fallback mapping
  async registerUser(username, password, fullName) {
    return this.createUser(username, password, fullName, 'tester', 'acquisition');
  }

  // --- APP PREFERENCES ---
  getPreference(key) {
    const stmt = this.db.prepare("SELECT value FROM AppPreferences WHERE key = ?");
    stmt.bind([key]);
    if (stmt.step()) {
      const val = stmt.getAsObject().value;
      stmt.free();
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    stmt.free();
    return null;
  }

  setPreference(key, value) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const stmt = this.db.prepare("INSERT OR REPLACE INTO AppPreferences (key, value) VALUES (?, ?)");
    stmt.run([key, valStr]);
    stmt.free();
    this.saveToDisk();
    return true;
  }

  // --- UNIVERSITY TEMPLATES CRUD ---
  getUniversityTemplates(vertical = '') {
    const res = [];
    let sql = "SELECT * FROM UniversityTemplates";
    const params = [];
    if (vertical && vertical !== 'all') {
      sql += " WHERE (LOWER(vertical) = LOWER(?) OR LOWER(vertical) = 'all')";
      params.push(vertical);
    }
    sql += " ORDER BY is_default DESC, id ASC";

    const tmplStmt = this.db.prepare(sql);
    if (params.length > 0) tmplStmt.bind(params);

    while (tmplStmt.step()) {
      const tmpl = tmplStmt.getAsObject();
      tmpl.is_default = Boolean(tmpl.is_default);
      if (tmpl.guidelines) {
        try {
          tmpl.guidelines = JSON.parse(tmpl.guidelines);
        } catch {}
      }

      // Fetch sections for this template
      const sections = [];
      const secStmt = this.db.prepare("SELECT * FROM TemplateSections WHERE template_id = ? ORDER BY order_no ASC, id ASC");
      secStmt.bind([tmpl.id]);
      while (secStmt.step()) {
        const sec = secStmt.getAsObject();
        
        // Fetch items for this section
        const items = [];
        const itemStmt = this.db.prepare("SELECT * FROM GlobalChecklist WHERE section_id = ? ORDER BY order_no ASC, id ASC");
        itemStmt.bind([sec.id]);
        while (itemStmt.step()) {
          items.push(itemStmt.getAsObject());
        }
        itemStmt.free();
        sec.items = items;
        sections.push(sec);
      }
      secStmt.free();
      tmpl.sections = sections;
      res.push(tmpl);
    }
    tmplStmt.free();
    return res;
  }

  getUniversityTemplateById(id) {
    const tmplStmt = this.db.prepare("SELECT * FROM UniversityTemplates WHERE id = ?");
    tmplStmt.bind([id]);
    if (!tmplStmt.step()) {
      tmplStmt.free();
      return null;
    }
    const tmpl = tmplStmt.getAsObject();
    tmpl.is_default = Boolean(tmpl.is_default);
    if (tmpl.guidelines) {
      try {
        tmpl.guidelines = JSON.parse(tmpl.guidelines);
      } catch {}
    }
    tmplStmt.free();

    const sections = [];
    const secStmt = this.db.prepare("SELECT * FROM TemplateSections WHERE template_id = ? ORDER BY order_no ASC, id ASC");
    secStmt.bind([id]);
    while (secStmt.step()) {
      const sec = secStmt.getAsObject();
      const items = [];
      const itemStmt = this.db.prepare("SELECT * FROM GlobalChecklist WHERE section_id = ? ORDER BY order_no ASC, id ASC");
      itemStmt.bind([sec.id]);
      while (itemStmt.step()) {
        items.push(itemStmt.getAsObject());
      }
      itemStmt.free();
      sec.items = items;
      sections.push(sec);
    }
    secStmt.free();
    tmpl.sections = sections;
    return tmpl;
  }

  createUniversityTemplate(name, description = '', guidelines = null, vertical = 'acquisition') {
    const guidelinesStr = typeof guidelines === 'object' && guidelines !== null 
      ? JSON.stringify(guidelines) 
      : (guidelines || '');
    const stmt = this.db.prepare("INSERT INTO UniversityTemplates (name, description, guidelines, vertical, is_default) VALUES (?, ?, ?, ?, 0)");
    stmt.run([name.trim(), description.trim(), guidelinesStr, vertical || 'acquisition']);
    stmt.free();

    const tmplId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    // Create a default initial section
    const secStmt = this.db.prepare("INSERT INTO TemplateSections (template_id, title, order_no) VALUES (?, 'General Sanity Checks', 1)");
    secStmt.run([tmplId]);
    secStmt.free();
    const secId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    // Create an initial item
    const itemStmt = this.db.prepare(
      "INSERT INTO GlobalChecklist (template_id, section_id, section_title, name, category, order_no, default_notes) VALUES (?, ?, 'General Sanity Checks', 'Initial Portal Verification', 'General', 1, 'Verify homepage & auth')"
    );
    itemStmt.run([tmplId, secId]);
    itemStmt.free();

    this.saveToDisk();
    return this.getUniversityTemplateById(tmplId);
  }

  updateUniversityTemplate(id, data) {
    if (data.name !== undefined) {
      const stmt = this.db.prepare("UPDATE UniversityTemplates SET name = ?, description = ? WHERE id = ?");
      stmt.run([data.name.trim(), data.description ? data.description.trim() : '', id]);
      stmt.free();
    }
    if (data.guidelines !== undefined) {
      const guidelinesStr = typeof data.guidelines === 'object' && data.guidelines !== null 
        ? JSON.stringify(data.guidelines) 
        : (data.guidelines || '');
      const stmt = this.db.prepare("UPDATE UniversityTemplates SET guidelines = ? WHERE id = ?");
      stmt.run([guidelinesStr, id]);
      stmt.free();
    }
    if (data.vertical !== undefined) {
      const stmt = this.db.prepare("UPDATE UniversityTemplates SET vertical = ? WHERE id = ?");
      stmt.run([data.vertical, id]);
      stmt.free();
    }
    if (data.is_default) {
      // Find the vertical of this template so we only reset is_default for the same vertical!
      const vStmt = this.db.prepare("SELECT vertical FROM UniversityTemplates WHERE id = ?");
      vStmt.bind([id]);
      let tmplVertical = 'acquisition';
      if (vStmt.step()) {
        tmplVertical = vStmt.getAsObject().vertical || 'acquisition';
      }
      vStmt.free();

      const resetDefStmt = this.db.prepare("UPDATE UniversityTemplates SET is_default = 0 WHERE LOWER(vertical) = LOWER(?)");
      resetDefStmt.run([tmplVertical]);
      resetDefStmt.free();

      const stmt = this.db.prepare("UPDATE UniversityTemplates SET is_default = 1 WHERE id = ?");
      stmt.run([id]);
      stmt.free();
    }
    this.saveToDisk();
    return true;
  }

  updateUniversityGuidelines(id, guidelines) {
    return this.updateUniversityTemplate(id, { guidelines });
  }

  deleteUniversityTemplate(id) {
    // Delete items, sections, and template
    this.db.run("DELETE FROM GlobalChecklist WHERE template_id = ?", [id]);
    this.db.run("DELETE FROM TemplateSections WHERE template_id = ?", [id]);
    this.db.run("DELETE FROM UniversityTemplates WHERE id = ?", [id]);
    this.saveToDisk();
    return true;
  }

  duplicateUniversityTemplate(id, newName = '') {
    const source = this.getUniversityTemplateById(id);
    if (!source) return null;

    const name = newName && newName.trim() ? newName.trim() : `${source.name} (Copy)`;
    const guidelinesStr = typeof source.guidelines === 'object' && source.guidelines !== null
      ? JSON.stringify(source.guidelines)
      : (source.guidelines || '');

    const stmt = this.db.prepare("INSERT INTO UniversityTemplates (name, description, guidelines, vertical, is_default) VALUES (?, ?, ?, ?, 0)");
    stmt.run([name, source.description || '', guidelinesStr, source.vertical || 'acquisition']);
    stmt.free();

    const newTmplId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    // Duplicate all sections and items
    (source.sections || []).forEach(sec => {
      const secStmt = this.db.prepare("INSERT INTO TemplateSections (template_id, title, order_no) VALUES (?, ?, ?)");
      secStmt.run([newTmplId, sec.title, sec.order_no || 1]);
      secStmt.free();
      const newSecId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

      (sec.items || []).forEach(item => {
        const itemStmt = this.db.prepare(
          "INSERT INTO GlobalChecklist (template_id, section_id, section_title, name, category, order_no, default_notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        itemStmt.run([
          newTmplId,
          newSecId,
          sec.title,
          item.name,
          item.category || sec.title,
          item.order_no || 1,
          item.default_notes || ''
        ]);
        itemStmt.free();
      });
    });

    this.saveToDisk();
    return this.getUniversityTemplateById(newTmplId);
  }

  // --- SECTION HEADERS CRUD ---
  addSectionToTemplate(templateId, title) {
    const numTemplateId = Number(templateId);
    const maxStmt = this.db.prepare("SELECT MAX(order_no) as max_order FROM TemplateSections WHERE template_id = ?");
    maxStmt.bind([numTemplateId]);
    maxStmt.step();
    const maxOrder = (maxStmt.getAsObject().max_order || 0) + 1;
    maxStmt.free();

    const stmt = this.db.prepare("INSERT INTO TemplateSections (template_id, title, order_no) VALUES (?, ?, ?)");
    stmt.run([numTemplateId, title.trim(), maxOrder]);
    stmt.free();

    const secId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    this.saveToDisk();
    return { id: secId, template_id: numTemplateId, title: title.trim(), order_no: maxOrder, items: [] };
  }

  updateSectionInTemplate(templateId, sectionId, title) {
    const numTemplateId = Number(templateId);
    const numSectionId = Number(sectionId);
    const stmt = this.db.prepare("UPDATE TemplateSections SET title = ? WHERE id = ? AND template_id = ?");
    stmt.run([title.trim(), numSectionId, numTemplateId]);
    stmt.free();

    // Also update section_title on items
    const itemStmt = this.db.prepare("UPDATE GlobalChecklist SET section_title = ?, category = ? WHERE section_id = ?");
    itemStmt.run([title.trim(), title.trim(), numSectionId]);
    itemStmt.free();

    this.saveToDisk();
    return true;
  }

  deleteSectionFromTemplate(templateId, sectionId) {
    const numTemplateId = Number(templateId);
    const numSectionId = Number(sectionId);
    this.db.run("DELETE FROM GlobalChecklist WHERE section_id = ?", [numSectionId]);
    this.db.run("DELETE FROM TemplateSections WHERE id = ? AND template_id = ?", [numSectionId, numTemplateId]);
    this.saveToDisk();
    return true;
  }

  reorderSections(templateId, orderedSectionIds) {
    const numTemplateId = Number(templateId);
    const stmt = this.db.prepare("UPDATE TemplateSections SET order_no = ? WHERE id = ? AND template_id = ?");
    orderedSectionIds.forEach((secId, idx) => {
      stmt.run([idx + 1, Number(secId), numTemplateId]);
    });
    stmt.free();
    this.saveToDisk();
    return true;
  }

  // --- GLOBAL CHECKLIST ITEMS (Inside Sections) CRUD ---
  addItemToSection(templateId, sectionId, name, defaultNotes = '') {
    const numTemplateId = Number(templateId);
    const numSectionId = Number(sectionId);

    // Look up section title
    const secStmt = this.db.prepare("SELECT title FROM TemplateSections WHERE id = ?");
    secStmt.bind([numSectionId]);
    let secTitle = 'General';
    if (secStmt.step()) {
      secTitle = secStmt.getAsObject().title;
    }
    secStmt.free();

    const maxStmt = this.db.prepare("SELECT MAX(order_no) as max_order FROM GlobalChecklist WHERE section_id = ?");
    maxStmt.bind([numSectionId]);
    maxStmt.step();
    const maxOrder = (maxStmt.getAsObject().max_order || 0) + 1;
    maxStmt.free();

    const stmt = this.db.prepare(
      "INSERT INTO GlobalChecklist (template_id, section_id, section_title, name, category, order_no, default_notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run([numTemplateId, numSectionId, secTitle, name.trim(), secTitle, maxOrder, defaultNotes.trim()]);
    stmt.free();

    const itemId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    this.saveToDisk();
    return {
      id: itemId,
      template_id: numTemplateId,
      section_id: numSectionId,
      section_title: secTitle,
      name: name.trim(),
      category: secTitle,
      order_no: maxOrder,
      default_notes: defaultNotes.trim()
    };
  }

  updateItemInSection(templateId, sectionId, itemId, name, defaultNotes = '') {
    const numItemId = Number(itemId);
    const stmt = this.db.prepare("UPDATE GlobalChecklist SET name = ?, default_notes = ? WHERE id = ?");
    stmt.run([name.trim(), defaultNotes.trim(), numItemId]);
    stmt.free();
    this.saveToDisk();
    return true;
  }

  deleteItemFromSection(templateId, sectionId, itemId) {
    const numItemId = Number(itemId);
    this.db.run("DELETE FROM GlobalChecklist WHERE id = ?", [numItemId]);
    this.saveToDisk();
    return true;
  }

  reorderItemsInSection(templateId, sectionId, orderedItemIds) {
    const stmt = this.db.prepare("UPDATE GlobalChecklist SET order_no = ? WHERE id = ?");
    orderedItemIds.forEach((itemId, idx) => {
      stmt.run([idx + 1, Number(itemId)]);
    });
    stmt.free();
    this.saveToDisk();
    return true;
  }

  resetToDefaultUniversityTemplates(vertical = '') {
    if (vertical && vertical !== 'all') {
      const stmt = this.db.prepare("SELECT id FROM UniversityTemplates WHERE LOWER(vertical) = LOWER(?)");
      stmt.bind([vertical]);
      const ids = [];
      while (stmt.step()) {
        ids.push(stmt.getAsObject().id);
      }
      stmt.free();

      ids.forEach(id => {
        this.db.run("DELETE FROM GlobalChecklist WHERE template_id = ?", [id]);
        this.db.run("DELETE FROM TemplateSections WHERE template_id = ?", [id]);
        this.db.run("DELETE FROM UniversityTemplates WHERE id = ?", [id]);
      });

      this.seedUniversityTemplatesForVertical(vertical);
      this.saveToDisk();
      return this.getUniversityTemplates(vertical);
    } else {
      this.db.run("DELETE FROM GlobalChecklist");
      this.db.run("DELETE FROM TemplateSections");
      this.db.run("DELETE FROM UniversityTemplates");
      this.seedUniversityTemplates();
      this.saveToDisk();
      return this.getUniversityTemplates();
    }
  }

  // --- CHECKLIST SESSIONS METHODS ---
  createSession(projectName, testerName = 'Tester', environment = 'QA', notes = '', universityTemplateId = null, vertical = null) {
    let tmpl = null;
    if (universityTemplateId) {
      tmpl = this.getUniversityTemplateById(universityTemplateId);
    }
    if (!tmpl) {
      const all = this.getUniversityTemplates(vertical);
      tmpl = all.find(t => t.is_default) || all[0] || this.getUniversityTemplates()[0];
    }

    const effectiveVertical = vertical || (tmpl && tmpl.vertical !== 'all' ? tmpl.vertical : 'acquisition');

    const insertSession = this.db.prepare(
      "INSERT INTO ChecklistSessions (project_name, university_name, template_id, tester_name, environment, status, vertical, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'In Progress', ?, ?, datetime('now'), datetime('now'))"
    );
    insertSession.run([projectName.trim(), tmpl ? tmpl.name : 'Standard Sanity Suite', tmpl ? tmpl.id : 1, testerName.trim(), environment, effectiveVertical, notes]);
    insertSession.free();

    const sessionId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    // Clone all sections & items from the selected university template
    const insertItem = this.db.prepare(
      "INSERT INTO ChecklistItems (session_id, section_title, item_name, category, status, screenshot_path, notes, order_no, updated_at) VALUES (?, ?, ?, ?, 'pending', NULL, ?, ?, datetime('now'))"
    );

    let counter = 1;
    if (tmpl && tmpl.sections) {
      tmpl.sections.forEach(sec => {
        (sec.items || []).forEach(item => {
          insertItem.run([sessionId, sec.title, item.name, sec.title, item.default_notes || '', counter++]);
        });
      });
    }
    insertItem.free();

    this.saveToDisk();
    return this.getSessionById(sessionId);
  }

  getSessions(searchQuery = '', dateFilter = '', statusFilter = '', vertical = '') {
    let sql = "SELECT * FROM ChecklistSessions WHERE 1=1";
    const params = [];

    if (vertical && vertical !== 'all') {
      sql += " AND LOWER(vertical) = LOWER(?)";
      params.push(vertical);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      sql += " AND (LOWER(project_name) LIKE LOWER(?) OR LOWER(tester_name) LIKE LOWER(?) OR LOWER(university_name) LIKE LOWER(?))";
      params.push(`%${searchQuery.trim()}%`, `%${searchQuery.trim()}%`, `%${searchQuery.trim()}%`);
    }

    if (dateFilter && dateFilter.trim() !== '') {
      sql += " AND DATE(created_at) = DATE(?)";
      params.push(dateFilter.trim());
    }

    if (statusFilter && statusFilter !== 'ALL') {
      sql += " AND LOWER(status) = LOWER(?)";
      params.push(statusFilter);
    }

    sql += " ORDER BY created_at DESC, id DESC";

    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const sessions = [];
    while (stmt.step()) {
      const sess = stmt.getAsObject();
      const countStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM ChecklistItems WHERE session_id = ?
      `);
      countStmt.bind([sess.id]);
      if (countStmt.step()) {
        sess.stats = countStmt.getAsObject();
      }
      countStmt.free();
      sessions.push(sess);
    }
    stmt.free();
    return sessions;
  }

  getSessionById(id) {
    const sessionStmt = this.db.prepare("SELECT * FROM ChecklistSessions WHERE id = ?");
    sessionStmt.bind([id]);
    if (!sessionStmt.step()) {
      sessionStmt.free();
      return null;
    }
    const session = sessionStmt.getAsObject();
    sessionStmt.free();

    const items = [];
    const itemsStmt = this.db.prepare("SELECT * FROM ChecklistItems WHERE session_id = ? ORDER BY order_no ASC, id ASC");
    itemsStmt.bind([id]);
    while (itemsStmt.step()) {
      items.push(itemsStmt.getAsObject());
    }
    itemsStmt.free();
    session.items = items;

    const total = items.length;
    const passed = items.filter(i => i.status === 'passed').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const blocked = items.filter(i => i.status === 'blocked').length;
    const skipped = items.filter(i => i.status === 'skipped').length;
    const pending = items.filter(i => i.status === 'pending').length;

    session.stats = { total, passed, failed, blocked, skipped, pending };
    return session;
  }

  updateSession(id, data) {
    const fields = [];
    const params = [];

    if (data.project_name !== undefined) {
      fields.push("project_name = ?");
      params.push(data.project_name.trim());
    }
    if (data.tester_name !== undefined) {
      fields.push("tester_name = ?");
      params.push(data.tester_name.trim());
    }
    if (data.environment !== undefined) {
      fields.push("environment = ?");
      params.push(data.environment);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push("notes = ?");
      params.push(data.notes);
    }
    if (data.vertical !== undefined) {
      fields.push("vertical = ?");
      params.push(data.vertical);
    }

    fields.push("updated_at = datetime('now')");
    params.push(id);

    const sql = `UPDATE ChecklistSessions SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(params);
    stmt.free();
    this.saveToDisk();
    return true;
  }

  deleteSession(id) {
    this.db.run("DELETE FROM ChecklistItems WHERE session_id = ?", [id]);
    this.db.run("DELETE FROM ChecklistSessions WHERE id = ?", [id]);
    this.saveToDisk();
    return true;
  }

  duplicateSession(id, newProjectName) {
    const original = this.getSessionById(id);
    if (!original) return null;

    const projectName = newProjectName || `${original.project_name} (Copy)`;
    const insertSession = this.db.prepare(
      "INSERT INTO ChecklistSessions (project_name, university_name, template_id, tester_name, environment, status, vertical, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'In Progress', ?, ?, datetime('now'), datetime('now'))"
    );
    insertSession.run([projectName, original.university_name || 'Standard QA Sanity Suite', original.template_id || 1, original.tester_name, original.environment, original.vertical || 'acquisition', original.notes || '']);
    insertSession.free();

    const newSessionId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];

    const insertItem = this.db.prepare(
      "INSERT INTO ChecklistItems (session_id, section_title, item_name, category, status, screenshot_path, notes, order_no, updated_at) VALUES (?, ?, ?, ?, 'pending', NULL, ?, ?, datetime('now'))"
    );

    original.items.forEach((item, idx) => {
      insertItem.run([newSessionId, item.section_title || item.category || 'General', item.item_name, item.category || 'General', item.notes || '', idx + 1]);
    });
    insertItem.free();

    this.saveToDisk();
    return this.getSessionById(newSessionId);
  }

  // --- CHECKLIST ITEMS METHODS ---
  updateItem(id, data) {
    const fields = [];
    const params = [];

    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push("notes = ?");
      params.push(data.notes);
    }
    if (data.screenshot_path !== undefined) {
      fields.push("screenshot_path = ?");
      params.push(data.screenshot_path);
    }
    if (data.item_name !== undefined) {
      fields.push("item_name = ?");
      params.push(data.item_name);
    }
    if (data.section_title !== undefined) {
      fields.push("section_title = ?");
      params.push(data.section_title);
    }

    if (fields.length === 0) return true;

    fields.push("updated_at = datetime('now')");
    params.push(id);

    const sql = `UPDATE ChecklistItems SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(params);
    stmt.free();

    // Auto-compute and update parent session status
    this.updateSessionStatusFromItems(id);

    this.saveToDisk();
    return true;
  }

  createItem(sessionId, itemName, sectionTitle = 'General Sanity Checks', notes = '') {
    const maxStmt = this.db.prepare("SELECT MAX(order_no) as max_order FROM ChecklistItems WHERE session_id = ?");
    maxStmt.bind([sessionId]);
    maxStmt.step();
    const maxOrder = (maxStmt.getAsObject().max_order || 0) + 1;
    maxStmt.free();

    const stmt = this.db.prepare(
      "INSERT INTO ChecklistItems (session_id, section_title, item_name, category, status, notes, order_no, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, datetime('now'))"
    );
    stmt.run([sessionId, sectionTitle.trim(), itemName.trim(), sectionTitle.trim(), notes.trim(), maxOrder]);
    stmt.free();

    const newItemId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    this.saveToDisk();

    const itemStmt = this.db.prepare("SELECT * FROM ChecklistItems WHERE id = ?");
    itemStmt.bind([newItemId]);
    itemStmt.step();
    const item = itemStmt.getAsObject();
    itemStmt.free();
    return item;
  }

  deleteItem(id) {
    this.db.run("DELETE FROM ChecklistItems WHERE id = ?", [id]);
    this.saveToDisk();
    return true;
  }

  reorderItems(sessionId, orderedIds) {
    const stmt = this.db.prepare("UPDATE ChecklistItems SET order_no = ? WHERE id = ? AND session_id = ?");
    orderedIds.forEach((id, idx) => {
      stmt.run([idx + 1, id, sessionId]);
    });
    stmt.free();
    this.saveToDisk();
    return true;
  }

  updateSessionStatusFromItems(itemId) {
    // Find session_id from item
    const stmt = this.db.prepare("SELECT session_id FROM ChecklistItems WHERE id = ?");
    stmt.bind([itemId]);
    if (stmt.step()) {
      const sessionId = stmt.getAsObject().session_id;
      stmt.free();

      const countStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM ChecklistItems WHERE session_id = ?
      `);
      countStmt.bind([sessionId]);
      countStmt.step();
      const stats = countStmt.getAsObject();
      countStmt.free();

      let newStatus = 'In Progress';
      if (stats.total > 0) {
        if (stats.failed > 0) {
          newStatus = 'Failed';
        } else if (stats.blocked > 0) {
          newStatus = 'Blocked';
        } else if (stats.passed === stats.total) {
          newStatus = 'Completed';
        }
      }

      const updateStmt = this.db.prepare("UPDATE ChecklistSessions SET status = ?, updated_at = datetime('now') WHERE id = ?");
      updateStmt.run([newStatus, sessionId]);
      updateStmt.free();
    } else {
      stmt.free();
    }
  }

  getDashboardStats(vertical = '') {
    let filterClause = '';
    const params = [];
    if (vertical && vertical !== 'all') {
      filterClause = 'WHERE LOWER(vertical) = LOWER(?)';
      params.push(vertical);
    }

    const totalProjectsStmt = this.db.prepare(`SELECT COUNT(DISTINCT project_name) as total FROM ChecklistSessions ${filterClause}`);
    if (params.length > 0) totalProjectsStmt.bind(params);
    totalProjectsStmt.step();
    const totalProjects = totalProjectsStmt.getAsObject().total || 0;
    totalProjectsStmt.free();

    const todayFilterClause = filterClause 
      ? `${filterClause} AND DATE(created_at) = DATE('now')` 
      : `WHERE DATE(created_at) = DATE('now')`;
    const todayStmt = this.db.prepare(`SELECT COUNT(*) as total FROM ChecklistSessions ${todayFilterClause}`);
    if (params.length > 0) todayStmt.bind(params);
    todayStmt.step();
    const todayChecklists = todayStmt.getAsObject().total || 0;
    todayStmt.free();

    let itemStatsSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ci.status = 'passed' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN ci.status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN ci.status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM ChecklistItems ci
    `;
    if (vertical && vertical !== 'all') {
      itemStatsSql += ` JOIN ChecklistSessions cs ON ci.session_id = cs.id WHERE LOWER(cs.vertical) = LOWER(?)`;
    }

    const itemStatsStmt = this.db.prepare(itemStatsSql);
    if (params.length > 0) itemStatsStmt.bind(params);
    itemStatsStmt.step();
    const itemStats = itemStatsStmt.getAsObject();
    itemStatsStmt.free();

    const passRate = itemStats.total > 0 ? Math.round((itemStats.passed / itemStats.total) * 100) : 100;
    const recent = this.getSessions('', '', 'ALL', vertical).slice(0, 5);

    return {
      totalProjects,
      todayChecklists,
      passRate,
      itemStats,
      recentSessions: recent
    };
  }
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
