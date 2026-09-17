const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const dbManager = require('./db/database');
const screenshotService = require('./services/screenshotService');
const pdfService = require('./services/pdfService');

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1050,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  // Graceful show on ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const distIndexPath = path.join(__dirname, '../dist/index.html');
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      if (fs.existsSync(distIndexPath)) {
        mainWindow.loadFile(distIndexPath);
      }
    });
  } else if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  const userDataDir = app.getPath('userData');
  console.log('[Main] App UserData path:', userDataDir);

  // Initialize DB and Screenshot Service in userData
  await dbManager.initialize(path.join(userDataDir, 'db'));
  screenshotService.initialize(path.join(userDataDir, 'uploads', 'screenshots'));

  setupIpcHandlers();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup all IPC handlers
function setupIpcHandlers() {
  // --- AUTH IPC ---
  ipcMain.handle('auth:login', async (_, { username, password }) => {
    return await dbManager.loginUser(username, password);
  });

  ipcMain.handle('auth:register', async (_, { username, password, fullName }) => {
    return await dbManager.registerUser(username, password, fullName);
  });

  ipcMain.handle('auth:getRememberedUser', async () => {
    return dbManager.getPreference('remembered_user');
  });

  ipcMain.handle('auth:setRememberedUser', async (_, data) => {
    return dbManager.setPreference('remembered_user', data);
  });

  ipcMain.handle('auth:logout', async () => {
    return true;
  });

  // --- ADMIN USER MANAGEMENT IPC ---
  ipcMain.handle('users:getAll', async () => {
    return dbManager.getAllUsers();
  });

  ipcMain.handle('users:create', async (_, { username, password, fullName, role, vertical }) => {
    return dbManager.createUser(username, password, fullName, role, vertical);
  });

  ipcMain.handle('users:update', async (_, { id, data }) => {
    return dbManager.updateUser(id, data);
  });

  ipcMain.handle('users:delete', async (_, id) => {
    return dbManager.deleteUser(id);
  });

  // --- UNIVERSITY TEMPLATES IPC ---
  ipcMain.handle('universityTemplates:getAll', async (_, payload) => {
    const vertical = payload && payload.vertical ? payload.vertical : '';
    return dbManager.getUniversityTemplates(vertical);
  });

  ipcMain.handle('universityTemplates:getById', async (_, id) => {
    return dbManager.getUniversityTemplateById(id);
  });

  ipcMain.handle('universityTemplates:create', async (_, { name, description, guidelines, vertical }) => {
    return dbManager.createUniversityTemplate(name, description, guidelines, vertical);
  });

  ipcMain.handle('universityTemplates:duplicate', async (_, { id, newName }) => {
    return dbManager.duplicateUniversityTemplate(id, newName);
  });

  ipcMain.handle('universityTemplates:update', async (_, { id, data }) => {
    return dbManager.updateUniversityTemplate(id, data);
  });

  ipcMain.handle('universityTemplates:updateGuidelines', async (_, { id, guidelines }) => {
    return dbManager.updateUniversityGuidelines(id, guidelines);
  });

  ipcMain.handle('universityTemplates:delete', async (_, id) => {
    return dbManager.deleteUniversityTemplate(id);
  });

  ipcMain.handle('universityTemplates:addSection', async (_, { templateId, title }) => {
    return dbManager.addSectionToTemplate(templateId, title);
  });

  ipcMain.handle('universityTemplates:updateSection', async (_, { templateId, sectionId, title }) => {
    return dbManager.updateSectionInTemplate(templateId, sectionId, title);
  });

  ipcMain.handle('universityTemplates:deleteSection', async (_, { templateId, sectionId }) => {
    return dbManager.deleteSectionFromTemplate(templateId, sectionId);
  });

  ipcMain.handle('universityTemplates:reorderSections', async (_, { templateId, orderedSectionIds }) => {
    return dbManager.reorderSections(templateId, orderedSectionIds);
  });

  ipcMain.handle('universityTemplates:addItem', async (_, { templateId, sectionId, name, defaultNotes }) => {
    return dbManager.addItemToSection(templateId, sectionId, name, defaultNotes);
  });

  ipcMain.handle('universityTemplates:updateItem', async (_, { templateId, sectionId, itemId, name, defaultNotes }) => {
    return dbManager.updateItemInSection(templateId, sectionId, itemId, name, defaultNotes);
  });

  ipcMain.handle('universityTemplates:deleteItem', async (_, { templateId, sectionId, itemId }) => {
    return dbManager.deleteItemFromSection(templateId, sectionId, itemId);
  });

  ipcMain.handle('universityTemplates:reorderItems', async (_, { templateId, sectionId, orderedItemIds }) => {
    return dbManager.reorderItemsInSection(templateId, sectionId, orderedItemIds);
  });

  ipcMain.handle('universityTemplates:resetDefaults', async (_, payload) => {
    const vertical = payload && payload.vertical ? payload.vertical : '';
    return dbManager.resetToDefaultUniversityTemplates(vertical);
  });

  // --- SESSIONS IPC ---
  ipcMain.handle('sessions:getSessions', async (_, { searchQuery, dateFilter, statusFilter, vertical }) => {
    return dbManager.getSessions(searchQuery, dateFilter, statusFilter, vertical);
  });

  ipcMain.handle('sessions:getSessionById', async (_, id) => {
    return dbManager.getSessionById(id);
  });

  ipcMain.handle('sessions:createSession', async (_, { projectName, testerName, environment, notes, universityTemplateId, vertical }) => {
    return dbManager.createSession(projectName, testerName, environment, notes, universityTemplateId, vertical);
  });

  ipcMain.handle('sessions:updateSession', async (_, { id, data }) => {
    return dbManager.updateSession(id, data);
  });

  ipcMain.handle('sessions:deleteSession', async (_, id) => {
    // Also clean up screenshots attached to session items
    const session = dbManager.getSessionById(id);
    if (session && session.items) {
      for (const item of session.items) {
        if (item.screenshot_path) {
          await screenshotService.deleteScreenshot(item.screenshot_path);
        }
      }
    }
    return dbManager.deleteSession(id);
  });

  ipcMain.handle('sessions:duplicateSession', async (_, { id, newProjectName }) => {
    return dbManager.duplicateSession(id, newProjectName);
  });

  ipcMain.handle('sessions:getDashboardStats', async (_, payload) => {
    const vertical = payload && payload.vertical ? payload.vertical : '';
    return dbManager.getDashboardStats(vertical);
  });

  // --- ITEMS IPC ---
  ipcMain.handle('items:updateItem', async (_, { itemId, updates }) => {
    return dbManager.updateItem(itemId, updates);
  });

  ipcMain.handle('items:addItem', async (_, { sessionId, itemName, sectionTitle, category, notes }) => {
    const sec = sectionTitle || category || 'General';
    return dbManager.addItemToSession(sessionId, itemName, sec, notes);
  });

  ipcMain.handle('items:deleteItem', async (_, itemId) => {
    return dbManager.deleteItemFromSession(itemId);
  });

  // --- SCREENSHOTS IPC ---
  ipcMain.handle('screenshots:saveScreenshot', async (_, { sessionId, itemId, data, filename }) => {
    // If item already has a screenshot, delete the old file
    const session = dbManager.getSessionById(sessionId);
    if (session) {
      const existing = session.items.find(i => i.id === itemId);
      if (existing && existing.screenshot_path) {
        await screenshotService.deleteScreenshot(existing.screenshot_path);
      }
    }

    const saveResult = await screenshotService.saveScreenshot(sessionId, itemId, data, filename);
    if (saveResult.success) {
      // Update item in database with path
      dbManager.updateItem(itemId, { screenshot_path: saveResult.filePath });
      return {
        success: true,
        filePath: saveResult.filePath,
        base64: screenshotService.getScreenshotBase64(saveResult.filePath)
      };
    }
    return saveResult;
  });

  ipcMain.handle('screenshots:deleteScreenshot', async (_, filePath) => {
    return await screenshotService.deleteScreenshot(filePath);
  });

  ipcMain.handle('screenshots:getScreenshotBase64', async (_, filePath) => {
    return screenshotService.getScreenshotBase64(filePath);
  });

  ipcMain.handle('screenshots:selectScreenshotFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Screenshot Image',
      filters: [
        { name: 'Images (PNG, JPG)', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // --- PDF EXPORT IPC ---
  ipcMain.handle('pdf:exportPDF', async (_, session) => {
    return await pdfService.promptAndExportPDF(mainWindow, session);
  });

  ipcMain.handle('pdf:openFile', async (_, filePath) => {
    if (filePath) {
      await shell.openPath(filePath);
      return true;
    }
    return false;
  });

  // --- WINDOW CONTROLS IPC ---
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });
}
