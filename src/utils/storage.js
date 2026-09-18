/**
 * Unified persistent storage for SanityFlow.
 * Supports Multi-Vertical Isolation (Acquisition, LMS, Exam Portal, ERP)
 * and University-Specific Templates with hierarchical Section Headers.
 * 
 * In Desktop Electron mode: communicates with SQLite via window.api IPC.
 * In Web / Multi-Laptop mode: communicates in real-time with centralized REST API (/api/...) on the server.
 */

export const VERTICAL_DEFINITIONS = [
  { key: 'acquisition', label: 'Acquisition', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { key: 'lms', label: 'LMS', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { key: 'exam-portal', label: 'Exam Portal', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { key: 'erp', label: 'ERP', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
];

export const DEFAULT_UNIVERSITY_TEMPLATES = [
  {
    id: 1,
    name: 'Acquisition Lead Funnel & CRM Sanity Suite',
    description: 'Admissions landing pages, student inquiry capture, CRM lead sync, and payment gateway checks',
    vertical: 'acquisition',
    is_default: true,
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
        id: 101,
        title: 'Lead Capture & Inquiry Forms',
        order_no: 1,
        items: [
          { id: 1001, name: 'Student Inquiry Form Submission & Field Validations', default_notes: 'Verify email and phone format', order_no: 1 },
          { id: 1002, name: 'UTM Campaign & Referrer Parameter Capture', default_notes: 'Check session parameters in payload', order_no: 2 },
          { id: 1003, name: 'Lead Deduplication & Spam Captcha Verification', default_notes: 'Verify duplicate submission prevention', order_no: 3 }
        ]
      },
      {
        id: 102,
        title: 'CRM Lead Ingestion & Notifications',
        order_no: 2,
        items: [
          { id: 1004, name: 'Instant CRM Lead Sync via Webhook Payload', default_notes: 'Check lead record created in CRM', order_no: 1 },
          { id: 1005, name: 'Automated Welcome Email & SMS Dispatch', default_notes: 'Verify OTP & transactional email trigger', order_no: 2 },
          { id: 1006, name: 'Counselor Round-Robin Lead Assignment', default_notes: 'Verify lead routing rule', order_no: 3 }
        ]
      },
      {
        id: 103,
        title: 'Application & Payment Gateway',
        order_no: 3,
        items: [
          { id: 1007, name: 'Online Application Fee Checkout (Stripe / Razorpay)', default_notes: 'Test 3D Secure test card', order_no: 1 },
          { id: 1008, name: 'Fee Receipt Generation & Download Link', default_notes: 'Verify PDF receipt and invoice number', order_no: 2 },
          { id: 1009, name: 'Application Status Tracker Dashboard', default_notes: 'Verify status updates from Submitted to Under Review', order_no: 3 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'LMS Course Player & Video Streaming Sanity Suite',
    description: 'Course catalog, video player streaming, student assignments, quiz engine, and discussion boards',
    vertical: 'lms',
    is_default: true,
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
        id: 201,
        title: 'Course Catalog & Enrollment',
        order_no: 1,
        items: [
          { id: 2001, name: 'Course Search, Filter by Subject & Self-Enrollment', default_notes: 'Verify instant course unlock', order_no: 1 },
          { id: 2002, name: 'Prerequisite Course Completion Lock & Enforcement', default_notes: 'Verify locked module alerts', order_no: 2 },
          { id: 2003, name: 'Course Syllabus, Overview & Downloadable Resources', default_notes: 'Check asset download links', order_no: 3 }
        ]
      },
      {
        id: 202,
        title: 'Lecture Player & Video Streaming',
        order_no: 2,
        items: [
          { id: 2004, name: 'Adaptive Bitrate HLS / MP4 Video Playback & Seeking', default_notes: 'Test 1.25x, 1.5x, 2.0x playback rates', order_no: 1 },
          { id: 2005, name: 'Subtitle / Closed Captions Multi-Language Toggle', default_notes: 'Verify English and Spanish captions', order_no: 2 },
          { id: 2006, name: 'Lesson Progress Auto-Save & Resume Playback Timestamp', default_notes: 'Refresh page and check resume point', order_no: 3 }
        ]
      },
      {
        id: 203,
        title: 'Assignments, Quizzes & Gradebook',
        order_no: 3,
        items: [
          { id: 2007, name: 'Assignment File Upload (PDF, DOCX up to 25MB)', default_notes: 'Verify upload progress bar', order_no: 1 },
          { id: 2008, name: 'Interactive Quiz Engine & Auto-Graded Multiple Choice', default_notes: 'Check score calculation', order_no: 2 },
          { id: 2009, name: 'Faculty Gradebook Review, Feedback & Certificate Generator', default_notes: 'Verify completion certificate PDF', order_no: 3 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Exam Portal Remote Proctoring Sanity Suite',
    description: 'Secure examination environment, AI webcam proctoring, timed question delivery, and auto-submit',
    vertical: 'exam-portal',
    is_default: true,
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
        id: 301,
        title: 'Candidate Authentication & Proctoring Setup',
        order_no: 1,
        items: [
          { id: 3001, name: 'Candidate Hall Ticket Verification & Biometric / Photo Match', default_notes: 'Check webcam photo snapshot', order_no: 1 },
          { id: 3002, name: 'Hardware Diagnostic Check (Camera, Mic, Network Speed)', default_notes: 'Verify all 3 pass green checks', order_no: 2 },
          { id: 3003, name: 'Fullscreen Lock & Multi-Monitor Screen Share Prevention', default_notes: 'Verify dual screen is blocked', order_no: 3 }
        ]
      },
      {
        id: 302,
        title: 'Timed Examination & Question Delivery',
        order_no: 2,
        items: [
          { id: 3004, name: 'Question Palette Navigation (Answered, Marked, Unvisited)', default_notes: 'Check color coded indicators', order_no: 1 },
          { id: 3005, name: 'Instant Response Auto-Save on Selection (Offline Buffer)', default_notes: 'Verify no data loss on latency spike', order_no: 2 },
          { id: 3006, name: 'Section Countdown Timer & 5-Minute Warning Toast', default_notes: 'Check timer sync with server clock', order_no: 3 }
        ]
      },
      {
        id: 303,
        title: 'Anti-Cheating Logs & Auto-Submission',
        order_no: 3,
        items: [
          { id: 3007, name: 'Tab-Switch & Background App Detection Alert', default_notes: 'Verify warning strike logged', order_no: 1 },
          { id: 3008, name: 'Periodic Background Webcam Snapshot Interval', default_notes: 'Verify snapshots stored in evidence log', order_no: 2 },
          { id: 3009, name: 'Auto-Submit on Timer Expiry & Encrypted Response Receipt', default_notes: 'Verify final confirmation hash', order_no: 3 }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'ERP Student Lifecycle & Fee Ledger Sanity Suite',
    description: 'Student records, tuition fee accounting, faculty timetable allocation, and transcript generation',
    vertical: 'erp',
    is_default: true,
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
        id: 401,
        title: 'Student Information & Lifecycle',
        order_no: 1,
        items: [
          { id: 4001, name: 'Student Master Profile & KYC Document Verification', default_notes: 'Check personal & guardian data', order_no: 1 },
          { id: 4002, name: 'Semester Term Enrollment & Department Allocation', default_notes: 'Verify batch student promotion', order_no: 2 },
          { id: 4003, name: 'Major, Minor & Elective Course Allocation Rules', default_notes: 'Check capacity limit enforcement', order_no: 3 }
        ]
      },
      {
        id: 402,
        title: 'Fee Accounting & Bursary Ledger',
        order_no: 2,
        items: [
          { id: 4004, name: 'Tuition, Hostel & Lab Fee Structure Calculation', default_notes: 'Verify category & scholarship discounts', order_no: 1 },
          { id: 4005, name: 'Installment Payment Schedule & Late Fee Penalty Calculation', default_notes: 'Check grace period logic', order_no: 2 },
          { id: 4006, name: 'Double-Entry Bursary Ledger Balancing & Audit Trail', default_notes: 'Verify debit matches credit', order_no: 3 }
        ]
      },
      {
        id: 403,
        title: 'Academics, Timetable & Transcripts',
        order_no: 3,
        items: [
          { id: 4007, name: 'Conflict-Free Faculty & Classroom Timetable Generation', default_notes: 'Verify 0 room schedule clashes', order_no: 1 },
          { id: 4008, name: 'Semester GPA / CGPA Calculation & Grade Moderation', default_notes: 'Check formula & rounding rules', order_no: 2 },
          { id: 4009, name: 'Official Encrypted Transcript PDF & QR Code Verification', default_notes: 'Scan QR code to verify authenticity', order_no: 3 }
        ]
      }
    ]
  }
];

// Helper functions for Offline Web Fallback Mode (localStorage)
function getLocalSessions() {
  const data = localStorage.getItem('sanityflow_sessions');
  return data ? JSON.parse(data) : [];
}

function saveLocalSessions(sessions) {
  localStorage.setItem('sanityflow_sessions', JSON.stringify(sessions));
}

function getLocalUniversityTemplates() {
  const data = localStorage.getItem('sanityflow_university_templates');
  if (data) {
    try { 
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem('sanityflow_university_templates', JSON.stringify(DEFAULT_UNIVERSITY_TEMPLATES));
  return DEFAULT_UNIVERSITY_TEMPLATES;
}

function saveLocalUniversityTemplates(templates) {
  localStorage.setItem('sanityflow_university_templates', JSON.stringify(templates));
}

function getLocalUsers() {
  const data = localStorage.getItem('sanityflow_users_list');
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  const defaultUsers = [
    { id: 1, username: 'admin', full_name: 'System Administrator', role: 'admin', vertical: 'all', created_at: new Date().toISOString() },
    { id: 2, username: 'acq_user', full_name: 'Acquisition QA Lead', role: 'tester', vertical: 'acquisition', created_at: new Date().toISOString() },
    { id: 3, username: 'lms_user', full_name: 'LMS QA Lead', role: 'tester', vertical: 'lms', created_at: new Date().toISOString() },
    { id: 4, username: 'exam_user', full_name: 'Exam Portal QA Lead', role: 'tester', vertical: 'exam-portal', created_at: new Date().toISOString() },
    { id: 5, username: 'erp_user', full_name: 'ERP QA Lead', role: 'tester', vertical: 'erp', created_at: new Date().toISOString() }
  ];
  localStorage.setItem('sanityflow_users_list', JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveLocalUsers(users) {
  localStorage.setItem('sanityflow_users_list', JSON.stringify(users));
}

export function getApiBaseUrl() {
  const customUrl = localStorage.getItem('sanityflow_server_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('sanityflow_server_url');
  } else {
    localStorage.setItem('sanityflow_server_url', url.trim().replace(/\/+$/, ''));
  }
}

// HTTP Fetch wrapper for real-time multi-device server synchronization
export async function apiFetch(endpoint, options = {}) {
  try {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Network offline / fallback to local storage
  }
  return null;
}

export async function checkServerConnection() {
  try {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = '/api/stats';
    const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const StorageService = {
  // --- ADMIN USER MANAGEMENT ---
  async getAllUsers() {
    if (window.api && window.api.users) {
      return await window.api.users.getAll();
    }
    const apiRes = await apiFetch('/api/users');
    if (apiRes && Array.isArray(apiRes)) {
      saveLocalUsers(apiRes);
      return apiRes;
    }
    return getLocalUsers();
  },

  async createUser(username, password, fullName, role = 'tester', vertical = 'acquisition') {
    if (window.api && window.api.users) {
      return await window.api.users.create(username, password, fullName, role, vertical);
    }
    const apiRes = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName, role, vertical })
    });
    if (apiRes) {
      if (apiRes.success) {
        const users = getLocalUsers();
        users.push(apiRes.user);
        saveLocalUsers(users);
      }
      return apiRes;
    }
    const users = getLocalUsers();
    if (users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return { success: false, message: 'Username is already taken' };
    }
    const newUser = {
      id: Date.now(),
      username: username.trim(),
      full_name: fullName || username,
      role,
      vertical,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    saveLocalUsers(users);
    return { success: true, user: newUser };
  },

  async updateUser(id, data) {
    const numId = Number(id);
    if (window.api && window.api.users) {
      return await window.api.users.update(numId, data);
    }
    const apiRes = await apiFetch(`/api/users/${numId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (apiRes) return apiRes.success;
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === numId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      saveLocalUsers(users);
      return true;
    }
    return false;
  },

  async deleteUser(id) {
    const numId = Number(id);
    if (window.api && window.api.users) {
      return await window.api.users.delete(numId);
    }
    const apiRes = await apiFetch(`/api/users/${numId}`, { method: 'DELETE' });
    if (apiRes) {
      let users = getLocalUsers().filter(u => u.id !== numId);
      saveLocalUsers(users);
      return apiRes;
    }
    let users = getLocalUsers();
    const target = users.find(u => u.id === numId);
    if (target && target.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      return { success: false, message: 'Cannot delete the only administrator account' };
    }
    users = users.filter(u => u.id !== numId);
    saveLocalUsers(users);
    return { success: true };
  },

  // --- UNIVERSITY TEMPLATES CRUD ---
  async getUniversityTemplates(vertical = '') {
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.getAll(vertical);
    }
    const query = vertical && vertical !== 'all' ? `?vertical=${encodeURIComponent(vertical)}` : '';
    const apiRes = await apiFetch(`/api/templates${query}`);
    if (apiRes && Array.isArray(apiRes)) {
      saveLocalUniversityTemplates(apiRes);
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    if (vertical && vertical !== 'all') {
      return templates.filter(t => (t.vertical || 'acquisition').toLowerCase() === vertical.toLowerCase());
    }
    return templates;
  },

  async getUniversityTemplateById(id) {
    const numId = Number(id);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.getById(numId);
    }
    const apiRes = await apiFetch(`/api/templates/${numId}`);
    if (apiRes && apiRes.id) {
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    return templates.find(t => t.id === numId) || null;
  },

  async createUniversityTemplate(name, description = '', guidelines = null, vertical = 'acquisition') {
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.create(name, description, guidelines, vertical);
    }
    const apiRes = await apiFetch('/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name, description, guidelines, vertical })
    });
    if (apiRes && apiRes.id) {
      const templates = getLocalUniversityTemplates();
      templates.push(apiRes);
      saveLocalUniversityTemplates(templates);
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    const newTmpl = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim(),
      guidelines: guidelines || { testAccounts: [], prerequisites: [], importantNotes: '' },
      vertical: vertical || 'acquisition',
      is_default: false,
      sections: [
        {
          id: Date.now() + 1,
          title: 'General Sanity Checks',
          order_no: 1,
          items: [
            { id: Date.now() + 2, name: 'Initial Portal Verification', default_notes: 'Verify homepage & auth', order_no: 1 }
          ]
        }
      ]
    };
    templates.push(newTmpl);
    saveLocalUniversityTemplates(templates);
    return newTmpl;
  },

  async duplicateUniversityTemplate(id, newName = '') {
    const numId = Number(id);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.duplicate(numId, newName);
    }
    const apiRes = await apiFetch(`/api/templates/${numId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newName })
    });
    if (apiRes && apiRes.id) {
      const templates = getLocalUniversityTemplates();
      templates.push(apiRes);
      saveLocalUniversityTemplates(templates);
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    const source = templates.find(t => String(t.id) === String(id));
    if (!source) return null;

    const newTmpl = {
      ...JSON.parse(JSON.stringify(source)),
      id: Date.now(),
      name: newName && newName.trim() ? newName.trim() : `${source.name} (Copy)`,
      is_default: false
    };
    templates.push(newTmpl);
    saveLocalUniversityTemplates(templates);
    return newTmpl;
  },

  async updateUniversityTemplate(id, data) {
    const numId = Number(id);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.update(numId, data);
    }
    const apiRes = await apiFetch(`/api/templates/${numId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const idx = templates.findIndex(t => String(t.id) === String(id));
    if (idx !== -1) {
      if (data.is_default) {
        const targetVert = (templates[idx].vertical || 'acquisition').toLowerCase();
        templates.forEach(t => {
          if ((t.vertical || 'acquisition').toLowerCase() === targetVert) {
            t.is_default = false;
          }
        });
      }
      templates[idx] = { ...templates[idx], ...data };
      saveLocalUniversityTemplates(templates);
      return true;
    }
    return false;
  },

  async updateUniversityGuidelines(id, guidelines) {
    const numId = Number(id);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.updateGuidelines(numId, guidelines);
    }
    const apiRes = await apiFetch(`/api/templates/${numId}/guidelines`, {
      method: 'PUT',
      body: JSON.stringify({ guidelines })
    });
    if (apiRes) return apiRes.success;
    return this.updateUniversityTemplate(id, { guidelines });
  },

  async deleteUniversityTemplate(id) {
    const numId = Number(id);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.delete(numId);
    }
    const apiRes = await apiFetch(`/api/templates/${numId}`, { method: 'DELETE' });
    if (apiRes) {
      const templates = getLocalUniversityTemplates().filter(t => String(t.id) !== String(id));
      saveLocalUniversityTemplates(templates);
      return apiRes.success;
    }
    const templates = getLocalUniversityTemplates();
    const filtered = templates.filter(t => String(t.id) !== String(id));
    saveLocalUniversityTemplates(filtered);
    return true;
  },

  // --- TEMPLATE SECTIONS (HEADERS) CRUD ---
  async addTemplateSection(templateId, title) {
    const numTmplId = Number(templateId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.addSection(numTmplId, title);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    if (apiRes && apiRes.id) {
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl) return null;
    if (!tmpl.sections) tmpl.sections = [];
    const maxOrder = tmpl.sections.reduce((max, s) => Math.max(max, s.order_no || 0), 0);
    const newSec = {
      id: Date.now(),
      template_id: tmpl.id,
      title: title.trim(),
      order_no: maxOrder + 1,
      items: []
    };
    tmpl.sections.push(newSec);
    saveLocalUniversityTemplates(templates);
    return newSec;
  },

  async addSection(templateId, title) {
    return this.addTemplateSection(templateId, title);
  },

  async updateTemplateSection(templateId, sectionId, title) {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.updateSection(numTmplId, numSecId, title);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    const sec = tmpl.sections.find(s => Number(s.id) === numSecId || String(s.id) === String(sectionId));
    if (sec) {
      sec.title = title.trim();
      saveLocalUniversityTemplates(templates);
      return true;
    }
    return false;
  },

  async updateSection(templateId, sectionId, title) {
    return this.updateTemplateSection(templateId, sectionId, title);
  },

  async deleteTemplateSection(templateId, sectionId) {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.deleteSection(numTmplId, numSecId);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}`, { method: 'DELETE' });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    tmpl.sections = tmpl.sections.filter(s => Number(s.id) !== numSecId && String(s.id) !== String(sectionId));
    saveLocalUniversityTemplates(templates);
    return true;
  },

  async deleteSection(templateId, sectionId) {
    return this.deleteTemplateSection(templateId, sectionId);
  },

  async reorderTemplateSections(templateId, orderedSectionIds) {
    const numTmplId = Number(templateId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.reorderSections(numTmplId, orderedSectionIds);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections-reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedSectionIds })
    });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    const secMap = new Map(tmpl.sections.map(s => [String(s.id), s]));
    const reordered = [];
    orderedSectionIds.forEach((id, idx) => {
      const s = secMap.get(String(id));
      if (s) {
        s.order_no = idx + 1;
        reordered.push(s);
        secMap.delete(String(id));
      }
    });
    secMap.forEach(s => reordered.push(s));
    tmpl.sections = reordered;
    saveLocalUniversityTemplates(templates);
    return true;
  },

  async reorderSections(templateId, orderedSectionIds) {
    return this.reorderTemplateSections(templateId, orderedSectionIds);
  },

  // --- TEMPLATE ITEMS (CHECKS UNDER HEADINGS) CRUD ---
  async addTemplateItem(templateId, sectionId, name, defaultNotes = '') {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.addItem(numTmplId, numSecId, name, defaultNotes);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}/items`, {
      method: 'POST',
      body: JSON.stringify({ name, defaultNotes })
    });
    if (apiRes && apiRes.id) {
      return apiRes;
    }
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return null;
    const sec = tmpl.sections.find(s => Number(s.id) === numSecId || String(s.id) === String(sectionId));
    if (!sec) return null;
    if (!sec.items) sec.items = [];
    const maxOrder = sec.items.reduce((max, i) => Math.max(max, i.order_no || 0), 0);
    const newItem = {
      id: Date.now(),
      template_id: tmpl.id,
      section_id: sec.id,
      name: name.trim(),
      default_notes: (defaultNotes || '').trim(),
      order_no: maxOrder + 1
    };
    sec.items.push(newItem);
    saveLocalUniversityTemplates(templates);
    return newItem;
  },

  async addItemToSection(templateId, sectionId, name, defaultNotes = '') {
    return this.addTemplateItem(templateId, sectionId, name, defaultNotes);
  },

  async updateTemplateItem(templateId, sectionId, itemId, name, defaultNotes = '') {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    const numItemId = Number(itemId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.updateItem(numTmplId, numSecId, numItemId, name, defaultNotes);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}/items/${numItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, defaultNotes })
    });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    const sec = tmpl.sections.find(s => Number(s.id) === numSecId || String(s.id) === String(sectionId));
    if (!sec || !sec.items) return false;
    const item = sec.items.find(i => Number(i.id) === numItemId || String(i.id) === String(itemId));
    if (item) {
      item.name = name.trim();
      item.default_notes = (defaultNotes || '').trim();
      saveLocalUniversityTemplates(templates);
      return true;
    }
    return false;
  },

  async updateItemInSection(templateId, sectionId, itemId, name, defaultNotes = '') {
    return this.updateTemplateItem(templateId, sectionId, itemId, name, defaultNotes);
  },

  async deleteTemplateItem(templateId, sectionId, itemId) {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    const numItemId = Number(itemId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.deleteItem(numTmplId, numSecId, numItemId);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}/items/${numItemId}`, { method: 'DELETE' });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    const sec = tmpl.sections.find(s => Number(s.id) === numSecId || String(s.id) === String(sectionId));
    if (!sec || !sec.items) return false;
    sec.items = sec.items.filter(i => Number(i.id) !== numItemId && String(i.id) !== String(itemId));
    saveLocalUniversityTemplates(templates);
    return true;
  },

  async deleteItemFromSection(templateId, sectionId, itemId) {
    return this.deleteTemplateItem(templateId, sectionId, itemId);
  },

  async reorderTemplateItems(templateId, sectionId, orderedItemIds) {
    const numTmplId = Number(templateId);
    const numSecId = Number(sectionId);
    if (window.api && window.api.universityTemplates) {
      return await window.api.universityTemplates.reorderItems(numTmplId, numSecId, orderedItemIds);
    }
    const apiRes = await apiFetch(`/api/templates/${numTmplId}/sections/${numSecId}/items-reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedItemIds })
    });
    if (apiRes) return apiRes.success;
    const templates = getLocalUniversityTemplates();
    const tmpl = templates.find(t => Number(t.id) === numTmplId || String(t.id) === String(templateId));
    if (!tmpl || !tmpl.sections) return false;
    const sec = tmpl.sections.find(s => Number(s.id) === numSecId || String(s.id) === String(sectionId));
    if (!sec || !sec.items) return false;
    const itemMap = new Map(sec.items.map(i => [String(i.id), i]));
    const reordered = [];
    orderedItemIds.forEach((id, idx) => {
      const it = itemMap.get(String(id));
      if (it) {
        it.order_no = idx + 1;
        reordered.push(it);
        itemMap.delete(String(id));
      }
    });
    itemMap.forEach(it => reordered.push(it));
    sec.items = reordered;
    saveLocalUniversityTemplates(templates);
    return true;
  },

  async reorderItemsInSection(templateId, sectionId, orderedItemIds) {
    return this.reorderTemplateItems(templateId, sectionId, orderedItemIds);
  },

  // --- SESSIONS ---
  async getSessions(searchQuery = '', dateFilter = '', statusFilter = 'ALL', vertical = '') {
    if (window.api && window.api.sessions) {
      return await window.api.sessions.getSessions(searchQuery, dateFilter, statusFilter, vertical);
    }

    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (dateFilter) params.set('date', dateFilter);
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
    if (vertical && vertical !== 'all') params.set('vertical', vertical);

    const apiRes = await apiFetch(`/api/sessions?${params.toString()}`);
    if (apiRes && Array.isArray(apiRes)) {
      saveLocalSessions(apiRes);
      return apiRes;
    }

    let sessions = getLocalSessions();

    if (vertical && vertical !== 'all') {
      sessions = sessions.filter(s => (s.vertical || 'acquisition').toLowerCase() === vertical.toLowerCase());
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      sessions = sessions.filter(s => 
        (s.project_name && s.project_name.toLowerCase().includes(q)) ||
        (s.tester_name && s.tester_name.toLowerCase().includes(q)) ||
        (s.university_name && s.university_name.toLowerCase().includes(q))
      );
    }

    if (dateFilter && dateFilter.trim() !== '') {
      sessions = sessions.filter(s => {
        const sDate = new Date(s.created_at).toISOString().split('T')[0];
        return sDate === dateFilter.trim();
      });
    }

    if (statusFilter && statusFilter !== 'ALL') {
      sessions = sessions.filter(s => (s.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    return sessions.map(s => {
      const items = s.items || [];
      const stats = {
        total: items.length,
        passed: items.filter(i => i.status === 'passed').length,
        failed: items.filter(i => i.status === 'failed').length,
        blocked: items.filter(i => i.status === 'blocked').length,
        skipped: items.filter(i => i.status === 'skipped').length,
        pending: items.filter(i => i.status === 'pending').length,
      };
      return { ...s, stats };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getSessionById(id) {
    const numId = Number(id);
    if (window.api && window.api.sessions) {
      return await window.api.sessions.getSessionById(numId);
    }

    const apiRes = await apiFetch(`/api/sessions/${numId}`);
    if (apiRes && apiRes.id) {
      return apiRes;
    }

    const sessions = getLocalSessions();
    const session = sessions.find(s => s.id === numId);
    if (!session) return null;

    const items = session.items || [];
    const stats = {
      total: items.length,
      passed: items.filter(i => i.status === 'passed').length,
      failed: items.filter(i => i.status === 'failed').length,
      blocked: items.filter(i => i.status === 'blocked').length,
      skipped: items.filter(i => i.status === 'skipped').length,
      pending: items.filter(i => i.status === 'pending').length,
    };
    return { ...session, stats };
  },

  async createSession(projectName, testerName, environment, notes, universityTemplateId = null, vertical = null) {
    if (window.api && window.api.sessions) {
      return await window.api.sessions.createSession(projectName, testerName, environment, notes, universityTemplateId, vertical);
    }

    const apiRes = await apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ projectName, testerName, environment, notes, universityTemplateId, vertical })
    });
    if (apiRes && apiRes.id) {
      const sessions = getLocalSessions();
      sessions.unshift(apiRes);
      saveLocalSessions(sessions);
      return apiRes;
    }

    const sessions = getLocalSessions();
    const templates = getLocalUniversityTemplates();
    const selectedTemplate = (universityTemplateId ? templates.find(t => t.id === Number(universityTemplateId)) : null) || templates[0];
    
    const effectiveVertical = vertical || (selectedTemplate && selectedTemplate.vertical !== 'all' ? selectedTemplate.vertical : 'acquisition');
    const newId = Date.now();
    const flattenedItems = [];
    let orderCounter = 1;

    (selectedTemplate.sections || []).forEach(sec => {
      (sec.items || []).forEach(item => {
        flattenedItems.push({
          id: newId + orderCounter,
          session_id: newId,
          section_title: sec.title,
          item_name: item.name,
          category: sec.title,
          status: 'pending',
          notes: item.default_notes || '',
          order_no: orderCounter++,
          screenshot_path: null
        });
      });
    });

    const newSession = {
      id: newId,
      project_name: projectName,
      university_name: selectedTemplate.name,
      template_id: selectedTemplate.id,
      tester_name: testerName,
      environment: environment || 'QA',
      status: 'In Progress',
      vertical: effectiveVertical,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: flattenedItems
    };

    sessions.unshift(newSession);
    saveLocalSessions(sessions);
    return newSession;
  },

  async updateSession(id, data) {
    const numId = Number(id);
    if (window.api && window.api.sessions) {
      return await window.api.sessions.updateSession(numId, data);
    }

    const apiRes = await apiFetch(`/api/sessions/${numId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (apiRes) return apiRes.success;

    const sessions = getLocalSessions();
    const idx = sessions.findIndex(s => s.id === numId);
    if (idx !== -1) {
      sessions[idx] = { ...sessions[idx], ...data, updated_at: new Date().toISOString() };
      saveLocalSessions(sessions);
      return true;
    }
    return false;
  },

  async deleteSession(id) {
    const numId = Number(id);
    if (window.api && window.api.sessions) {
      return await window.api.sessions.deleteSession(numId);
    }

    const apiRes = await apiFetch(`/api/sessions/${numId}`, { method: 'DELETE' });
    if (apiRes) {
      const filtered = getLocalSessions().filter(s => s.id !== numId);
      saveLocalSessions(filtered);
      return apiRes.success;
    }

    const sessions = getLocalSessions();
    const filtered = sessions.filter(s => s.id !== numId);
    saveLocalSessions(filtered);
    return true;
  },

  async duplicateSession(id, newProjectName = '') {
    const numId = Number(id);
    if (window.api && window.api.sessions) {
      return await window.api.sessions.duplicateSession(numId, newProjectName);
    }

    const apiRes = await apiFetch(`/api/sessions/${numId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newProjectName })
    });
    if (apiRes && apiRes.id) {
      const sessions = getLocalSessions();
      sessions.unshift(apiRes);
      saveLocalSessions(sessions);
      return apiRes;
    }

    const sessions = getLocalSessions();
    const source = sessions.find(s => s.id === numId);
    if (!source) return null;

    const newId = Date.now();
    const newSession = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      project_name: newProjectName && newProjectName.trim() ? newProjectName.trim() : `${source.project_name} (Copy)`,
      status: 'In Progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: (source.items || []).map((item, idx) => ({
        ...item,
        id: newId + idx + 1,
        session_id: newId,
        status: 'pending',
        screenshot_path: null
      }))
    };

    sessions.unshift(newSession);
    saveLocalSessions(sessions);
    return newSession;
  },

  // --- SESSION CHECKLIST ITEMS ---
  async updateItem(arg1, arg2, arg3) {
    let numSessionId = null;
    let numItemId = null;
    let data = null;

    if (arg3 !== undefined) {
      numSessionId = Number(arg1);
      numItemId = Number(arg2);
      data = arg3;
    } else {
      numItemId = Number(arg1);
      data = arg2;
    }

    if (window.api && window.api.items) {
      return await window.api.items.updateItem(numItemId, data);
    }

    const apiRes = await apiFetch(`/api/items/${numItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (apiRes) return apiRes.success;

    const sessions = getLocalSessions();
    for (const session of sessions) {
      if (numSessionId && session.id !== numSessionId) continue;
      if (session && session.items) {
        const item = session.items.find(i => i.id === numItemId);
        if (item) {
          Object.assign(item, data, { updated_at: new Date().toISOString() });
          this._updateSessionStatus(session);
          saveLocalSessions(sessions);
          return true;
        }
      }
    }
    return false;
  },

  async addItem(sessionId, itemName, sectionTitle = 'General Sanity Checks', notes = '') {
    const numSessionId = Number(sessionId);

    if (window.api && window.api.items) {
      return await window.api.items.addItem(numSessionId, itemName, sectionTitle, notes);
    }

    const apiRes = await apiFetch(`/api/sessions/${numSessionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ itemName, sectionTitle, notes })
    });
    if (apiRes && apiRes.id) {
      return apiRes;
    }

    const sessions = getLocalSessions();
    const session = sessions.find(s => s.id === numSessionId);
    if (session) {
      if (!session.items) session.items = [];
      const maxOrder = session.items.reduce((max, i) => Math.max(max, i.order_no || 0), 0);
      const newItem = {
        id: Date.now(),
        session_id: numSessionId,
        section_title: sectionTitle.trim(),
        item_name: itemName.trim(),
        category: sectionTitle.trim(),
        status: 'pending',
        notes: notes.trim(),
        order_no: maxOrder + 1,
        screenshot_path: null,
        updated_at: new Date().toISOString()
      };
      session.items.push(newItem);
      this._updateSessionStatus(session);
      saveLocalSessions(sessions);
      return newItem;
    }
    return null;
  },

  async addItemToSession(sessionId, itemName, sectionTitle = 'General Sanity Checks', notes = '') {
    return this.addItem(sessionId, itemName, sectionTitle, notes);
  },

  async deleteItem(arg1, arg2) {
    let numSessionId = null;
    let numItemId = null;

    if (arg2 !== undefined) {
      numSessionId = Number(arg1);
      numItemId = Number(arg2);
    } else {
      numItemId = Number(arg1);
    }

    if (window.api && window.api.items) {
      return await window.api.items.deleteItem(numItemId);
    }

    const apiRes = await apiFetch(`/api/items/${numItemId}`, { method: 'DELETE' });
    if (apiRes) return apiRes.success;

    const sessions = getLocalSessions();
    for (const session of sessions) {
      if (numSessionId && session.id !== numSessionId) continue;
      if (session && session.items) {
        const idx = session.items.findIndex(i => i.id === numItemId);
        if (idx !== -1) {
          session.items.splice(idx, 1);
          this._updateSessionStatus(session);
          saveLocalSessions(sessions);
          return true;
        }
      }
    }
    return false;
  },

  // --- DASHBOARD STATS ---
  async getDashboardStats(vertical = '') {
    if (window.api && window.api.sessions) {
      return await window.api.sessions.getDashboardStats(vertical);
    }

    const query = vertical && vertical !== 'all' ? `?vertical=${encodeURIComponent(vertical)}` : '';
    const apiRes = await apiFetch(`/api/stats${query}`);
    if (apiRes && apiRes.totalProjects !== undefined) {
      return apiRes;
    }

    let sessions = getLocalSessions();
    if (vertical && vertical !== 'all') {
      sessions = sessions.filter(s => (s.vertical || 'acquisition').toLowerCase() === vertical.toLowerCase());
    }

    const totalProjects = new Set(sessions.map(s => s.project_name)).size;
    const today = new Date().toISOString().split('T')[0];
    const todayChecklists = sessions.filter(s => {
      const sDate = new Date(s.created_at).toISOString().split('T')[0];
      return sDate === today;
    }).length;

    let totalItems = 0;
    let passedItems = 0;
    let failedItems = 0;
    let blockedItems = 0;

    sessions.forEach(s => {
      (s.items || []).forEach(item => {
        totalItems++;
        if (item.status === 'passed') passedItems++;
        else if (item.status === 'failed') failedItems++;
        else if (item.status === 'blocked') blockedItems++;
      });
    });

    const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 100;
    const recentSessions = await this.getSessions('', '', 'ALL', vertical);

    return {
      totalProjects,
      todayChecklists,
      passRate,
      itemStats: {
        total: totalItems,
        passed: passedItems,
        failed: failedItems,
        blocked: blockedItems
      },
      recentSessions: recentSessions.slice(0, 5)
    };
  },

  _updateSessionStatus(session) {
    const items = session.items || [];
    const hasFailed = items.some(i => i.status === 'failed');
    const hasBlocked = items.some(i => i.status === 'blocked');
    const allPassed = items.length > 0 && items.every(i => i.status === 'passed');

    if (hasFailed) session.status = 'Failed';
    else if (hasBlocked) session.status = 'Blocked';
    else if (allPassed) session.status = 'Completed';
    else session.status = 'In Progress';
    session.updated_at = new Date().toISOString();
  }
};
