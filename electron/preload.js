const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Auth API
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    register: (username, password, fullName) => ipcRenderer.invoke('auth:register', { username, password, fullName }),
    getRememberedUser: () => ipcRenderer.invoke('auth:getRememberedUser'),
    setRememberedUser: (data) => ipcRenderer.invoke('auth:setRememberedUser', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },

  // Admin User Management API
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    create: (username, password, fullName, role, vertical) => ipcRenderer.invoke('users:create', { username, password, fullName, role, vertical }),
    update: (id, data) => ipcRenderer.invoke('users:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('users:delete', id),
  },

  // University Templates API
  universityTemplates: {
    getAll: (vertical) => ipcRenderer.invoke('universityTemplates:getAll', { vertical }),
    getById: (id) => ipcRenderer.invoke('universityTemplates:getById', id),
    create: (name, description, guidelines, vertical) => ipcRenderer.invoke('universityTemplates:create', { name, description, guidelines, vertical }),
    duplicate: (id, newName) => ipcRenderer.invoke('universityTemplates:duplicate', { id, newName }),
    update: (id, data) => ipcRenderer.invoke('universityTemplates:update', { id, data }),
    updateGuidelines: (id, guidelines) => ipcRenderer.invoke('universityTemplates:updateGuidelines', { id, guidelines }),
    delete: (id) => ipcRenderer.invoke('universityTemplates:delete', id),
    addSection: (templateId, title) => ipcRenderer.invoke('universityTemplates:addSection', { templateId, title }),
    updateSection: (templateId, sectionId, title) => ipcRenderer.invoke('universityTemplates:updateSection', { templateId, sectionId, title }),
    deleteSection: (templateId, sectionId) => ipcRenderer.invoke('universityTemplates:deleteSection', { templateId, sectionId }),
    reorderSections: (templateId, orderedSectionIds) => ipcRenderer.invoke('universityTemplates:reorderSections', { templateId, orderedSectionIds }),
    addItem: (templateId, sectionId, name, defaultNotes) => ipcRenderer.invoke('universityTemplates:addItem', { templateId, sectionId, name, defaultNotes }),
    updateItem: (templateId, sectionId, itemId, name, defaultNotes) => ipcRenderer.invoke('universityTemplates:updateItem', { templateId, sectionId, itemId, name, defaultNotes }),
    deleteItem: (templateId, sectionId, itemId) => ipcRenderer.invoke('universityTemplates:deleteItem', { templateId, sectionId, itemId }),
    reorderItems: (templateId, sectionId, orderedItemIds) => ipcRenderer.invoke('universityTemplates:reorderItems', { templateId, sectionId, orderedItemIds }),
    resetDefaults: (vertical) => ipcRenderer.invoke('universityTemplates:resetDefaults', { vertical }),
  },

  // Global Template Legacy compatibility
  template: {
    getGlobalTemplate: () => ipcRenderer.invoke('template:getGlobalTemplate'),
    addTemplateItem: (name, category, defaultNotes) => ipcRenderer.invoke('template:addTemplateItem', { name, category, defaultNotes }),
    updateTemplateItem: (id, name, category, defaultNotes) => ipcRenderer.invoke('template:updateTemplateItem', { id, name, category, defaultNotes }),
    deleteTemplateItem: (id) => ipcRenderer.invoke('template:deleteTemplateItem', id),
    reorderTemplateItems: (orderedIds) => ipcRenderer.invoke('template:reorderTemplateItems', orderedIds),
    resetGlobalTemplate: () => ipcRenderer.invoke('template:resetGlobalTemplate'),
  },

  // Sessions API
  sessions: {
    getSessions: (searchQuery, dateFilter, statusFilter, vertical) => ipcRenderer.invoke('sessions:getSessions', { searchQuery, dateFilter, statusFilter, vertical }),
    getSessionById: (id) => ipcRenderer.invoke('sessions:getSessionById', id),
    createSession: (projectName, testerName, environment, notes, universityTemplateId, vertical) => ipcRenderer.invoke('sessions:createSession', { projectName, testerName, environment, notes, universityTemplateId, vertical }),
    updateSession: (id, data) => ipcRenderer.invoke('sessions:updateSession', { id, data }),
    deleteSession: (id) => ipcRenderer.invoke('sessions:deleteSession', id),
    duplicateSession: (id, newProjectName) => ipcRenderer.invoke('sessions:duplicateSession', { id, newProjectName }),
    getDashboardStats: (vertical) => ipcRenderer.invoke('sessions:getDashboardStats', { vertical }),
  },

  // Items API
  items: {
    updateItem: (itemId, updates) => ipcRenderer.invoke('items:updateItem', { itemId, updates }),
    addItem: (sessionId, itemName, sectionTitle, notes) => ipcRenderer.invoke('items:addItem', { sessionId, itemName, sectionTitle, notes }),
    deleteItem: (itemId) => ipcRenderer.invoke('items:deleteItem', itemId),
  },

  // Screenshots API
  screenshots: {
    saveScreenshot: (sessionId, itemId, data, filename) => ipcRenderer.invoke('screenshots:saveScreenshot', { sessionId, itemId, data, filename }),
    deleteScreenshot: (filePath) => ipcRenderer.invoke('screenshots:deleteScreenshot', filePath),
    getScreenshotBase64: (filePath) => ipcRenderer.invoke('screenshots:getScreenshotBase64', filePath),
    selectScreenshotFile: () => ipcRenderer.invoke('screenshots:selectScreenshotFile'),
  },

  // PDF Export API
  pdf: {
    exportPDF: (session) => ipcRenderer.invoke('pdf:exportPDF', session),
    openFile: (filePath) => ipcRenderer.invoke('pdf:openFile', filePath),
  },

  // Desktop Window Controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  }
});
