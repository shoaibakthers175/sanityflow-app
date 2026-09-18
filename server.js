const express = require('express');
const path = require('path');
const fs = require('fs');
const dbManager = require('./electron/db/database.js');

const app = express();
const PORT = process.env.PORT || 10000;

// JSON and URL-encoded body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware for local development / multi-host access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize database
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let isDbReady = false;
const dbInitPromise = dbManager.initialize(dataDir).then(() => {
  isDbReady = true;
  console.log('[API] Database initialized successfully for multi-device synchronization');
}).catch(err => {
  console.error('[API] Error initializing database:', err);
});

// Middleware to ensure DB is initialized before handling /api requests
app.use('/api', async (req, res, next) => {
  if (!isDbReady) {
    await dbInitPromise;
  }
  next();
});

// --- AUTH API ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const result = await dbManager.loginUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// --- USERS API ---
app.get('/api/users', (req, res) => {
  try {
    const users = dbManager.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, password, fullName, role, vertical } = req.body;
    const result = dbManager.createUser(username, password, fullName, role, vertical);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const result = dbManager.updateUser(req.params.id, req.body);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const result = dbManager.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- UNIVERSITY TEMPLATES API ---
app.get('/api/templates', (req, res) => {
  try {
    const vertical = req.query.vertical || '';
    const templates = dbManager.getUniversityTemplates(vertical);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const template = dbManager.getUniversityTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const { name, description, guidelines, vertical } = req.body;
    const newTmpl = dbManager.createUniversityTemplate(name, description, guidelines, vertical);
    res.json(newTmpl);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const result = dbManager.updateUniversityTemplate(req.params.id, req.body);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id/guidelines', (req, res) => {
  try {
    const { guidelines } = req.body;
    const result = dbManager.updateUniversityGuidelines(req.params.id, guidelines);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const result = dbManager.deleteUniversityTemplate(req.params.id);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/templates/:id/duplicate', (req, res) => {
  try {
    const { newName } = req.body;
    const duplicated = dbManager.duplicateUniversityTemplate(req.params.id, newName);
    res.json(duplicated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- TEMPLATE SECTIONS API ---
app.post('/api/templates/:id/sections', (req, res) => {
  try {
    const { title } = req.body;
    const section = dbManager.addSectionToTemplate(req.params.id, title);
    res.json(section);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id/sections/:sectionId', (req, res) => {
  try {
    const { title } = req.body;
    const result = dbManager.updateSectionInTemplate(req.params.id, req.params.sectionId, title);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/templates/:id/sections/:sectionId', (req, res) => {
  try {
    const result = dbManager.deleteSectionFromTemplate(req.params.id, req.params.sectionId);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id/sections-reorder', (req, res) => {
  try {
    const { orderedSectionIds } = req.body;
    const result = dbManager.reorderSections(req.params.id, orderedSectionIds || []);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- TEMPLATE ITEMS API ---
app.post('/api/templates/:id/sections/:sectionId/items', (req, res) => {
  try {
    const { name, defaultNotes } = req.body;
    const item = dbManager.addItemToSection(req.params.id, req.params.sectionId, name, defaultNotes);
    res.json(item);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id/sections/:sectionId/items/:itemId', (req, res) => {
  try {
    const { name, defaultNotes } = req.body;
    const result = dbManager.updateItemInSection(req.params.id, req.params.sectionId, req.params.itemId, name, defaultNotes);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/templates/:id/sections/:sectionId/items/:itemId', (req, res) => {
  try {
    const result = dbManager.deleteItemFromSection(req.params.id, req.params.sectionId, req.params.itemId);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/templates/:id/sections/:sectionId/items-reorder', (req, res) => {
  try {
    const { orderedItemIds } = req.body;
    const result = dbManager.reorderItemsInSection(req.params.id, req.params.sectionId, orderedItemIds || []);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SESSIONS API ---
app.get('/api/sessions', (req, res) => {
  try {
    const { search, date, status, vertical } = req.query;
    const sessions = dbManager.getSessions(search || '', date || '', status || 'ALL', vertical || '');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  try {
    const session = dbManager.getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sessions', (req, res) => {
  try {
    const { projectName, testerName, environment, notes, universityTemplateId, vertical } = req.body;
    const session = dbManager.createSession(projectName, testerName, environment, notes, universityTemplateId, vertical);
    res.json(session);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/sessions/:id', (req, res) => {
  try {
    const result = dbManager.updateSession(req.params.id, req.body);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  try {
    const result = dbManager.deleteSession(req.params.id);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sessions/:id/duplicate', (req, res) => {
  try {
    const { newProjectName } = req.body;
    const duplicated = dbManager.duplicateSession(req.params.id, newProjectName);
    res.json(duplicated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- CHECKLIST SESSION ITEMS API ---
app.post('/api/sessions/:id/items', (req, res) => {
  try {
    const { itemName, sectionTitle, notes } = req.body;
    const newItem = dbManager.addItemToSession(req.params.id, itemName, sectionTitle, notes);
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const result = dbManager.updateItem(req.params.id, req.body);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const result = dbManager.deleteItem(req.params.id);
    res.json({ success: Boolean(result) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- DASHBOARD STATS API ---
app.get('/api/stats', (req, res) => {
  try {
    const vertical = req.query.vertical || '';
    const stats = dbManager.getDashboardStats(vertical);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- STATIC ASSETS & SPA ROUTING ---
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.resolve(distPath, 'index.html');

app.use(express.static(distPath));

// Fallback all other routes to index.html (SPA client-side routing)
app.use((req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('SanityFlow Server is running. Build frontend with `npm run build` to serve SPA.');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SanityFlow Multi-Device Server active on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} from any laptop/browser on the network`);
});

module.exports = { app, server };
