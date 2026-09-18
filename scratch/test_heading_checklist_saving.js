const dbManager = require('../electron/db/database.js');
const path = require('path');
const fs = require('fs');

// Mock browser localStorage for node testing of web fallback mode
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();
global.window = {}; // window.api is undefined -> pure Web/localStorage mode

async function runTests() {
  console.log('=== TEST 1: WEB / LOCALSTORAGE FALLBACK MODE ===');
  
  // Dynamic import of StorageService
  const { StorageService, DEFAULT_UNIVERSITY_TEMPLATES } = require('../src/utils/storage.js');

  // 1. Get templates
  let tmpls = await StorageService.getUniversityTemplates('acquisition');
  console.log(`Initial acquisition templates count: ${tmpls.length}`);
  const targetTmpl = tmpls[0];
  console.log(`Target Template: [${targetTmpl.id}] ${targetTmpl.name}`);
  const initialSectionsCount = targetTmpl.sections.length;

  // 2. Add Section Header
  const newSec = await StorageService.addTemplateSection(targetTmpl.id, 'Payment Security & 3DS Gateway');
  console.log(`Added Section: [${newSec.id}] "${newSec.title}" (order: ${newSec.order_no})`);

  // Verify in stored template
  let updatedTmpl = await StorageService.getUniversityTemplateById(targetTmpl.id);
  if (updatedTmpl.sections.length !== initialSectionsCount + 1) {
    throw new Error(`Expected ${initialSectionsCount + 1} sections, got ${updatedTmpl.sections.length}`);
  }
  console.log('Section Header saved successfully in localStorage!');

  // 3. Add Items under new section
  const item1 = await StorageService.addTemplateItem(targetTmpl.id, newSec.id, 'Verify OTP 3D Secure Modal Trigger', 'Check OTP iframe');
  const item2 = await StorageService.addTemplateItem(targetTmpl.id, newSec.id, 'Verify Payment Failure Error Toast', 'Test declining test card');
  console.log(`Added Item 1: [${item1.id}] "${item1.name}"`);
  console.log(`Added Item 2: [${item2.id}] "${item2.name}"`);

  updatedTmpl = await StorageService.getUniversityTemplateById(targetTmpl.id);
  const foundSec = updatedTmpl.sections.find(s => s.id === newSec.id);
  if (!foundSec || foundSec.items.length !== 2) {
    throw new Error(`Expected 2 items in section, got ${foundSec ? foundSec.items.length : 0}`);
  }
  console.log('Items under Section saved successfully in localStorage!');

  // 4. Update section title
  await StorageService.updateTemplateSection(targetTmpl.id, newSec.id, 'Payment Gateway & PCI Compliance');
  updatedTmpl = await StorageService.getUniversityTemplateById(targetTmpl.id);
  const renamedSec = updatedTmpl.sections.find(s => s.id === newSec.id);
  if (renamedSec.title !== 'Payment Gateway & PCI Compliance') {
    throw new Error(`Section rename failed: expected 'Payment Gateway & PCI Compliance', got '${renamedSec.title}'`);
  }
  console.log('Section rename saved successfully!');

  // 5. Update item title & notes
  await StorageService.updateTemplateItem(targetTmpl.id, newSec.id, item1.id, 'Verify OTP 3D Secure Webhook & Modal Trigger', 'Updated test note');
  updatedTmpl = await StorageService.getUniversityTemplateById(targetTmpl.id);
  const foundItem = updatedTmpl.sections.find(s => s.id === newSec.id).items.find(i => i.id === item1.id);
  if (foundItem.name !== 'Verify OTP 3D Secure Webhook & Modal Trigger' || foundItem.default_notes !== 'Updated test note') {
    throw new Error(`Item update failed: ${JSON.stringify(foundItem)}`);
  }
  console.log('Item edit saved successfully!');

  // 6. Reorder items
  await StorageService.reorderTemplateItems(targetTmpl.id, newSec.id, [item2.id, item1.id]);
  updatedTmpl = await StorageService.getUniversityTemplateById(targetTmpl.id);
  const reorderedSec = updatedTmpl.sections.find(s => s.id === newSec.id);
  if (reorderedSec.items[0].id !== item2.id || reorderedSec.items[1].id !== item1.id) {
    throw new Error(`Item reorder failed: ${JSON.stringify(reorderedSec.items)}`);
  }
  console.log('Item reorder saved successfully!');

  // 7. Create a session from this modified template
  const newSession = await StorageService.createSession('Test Session with Heading Checklists', 'Tester Alex', 'QA', '', targetTmpl.id, 'acquisition');
  console.log(`Created Session [${newSession.id}] with ${newSession.items.length} items.`);
  const hasCustomSection = newSession.items.some(i => i.section_title === 'Payment Gateway & PCI Compliance');
  if (!hasCustomSection) {
    throw new Error('Created session items did not include custom section!');
  }
  console.log('Session correctly inherited the customized heading checklists!');

  // 8. Test session item status update and delete
  const sessionItem = newSession.items[0];
  await StorageService.updateItem(sessionItem.id, { status: 'passed', notes: 'Verified in test' });
  const reloadedSession = await StorageService.getSessionById(newSession.id);
  if (reloadedSession.items.find(i => i.id === sessionItem.id).status !== 'passed') {
    throw new Error('Session item status update failed!');
  }
  console.log('Session item updateItem(itemId, data) 2-arg signature works!');

  console.log('\n=== TEST 2: ELECTRON SQLITE DATABASE MODE ===');
  const testDbDir = path.join(__dirname, 'test_heading_db');
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  await dbManager.initialize(testDbDir);
  const sqlTmpl = dbManager.getUniversityTemplates('acquisition')[0];
  console.log(`SQLite Template: [${sqlTmpl.id}] ${sqlTmpl.name}`);

  // Add Section in SQLite
  const sqlSec = dbManager.addSectionToTemplate(sqlTmpl.id, 'SQLite Test Security Section');
  console.log(`SQLite Added Section: [${sqlSec.id}] "${sqlSec.title}"`);

  // Add Item in SQLite
  const sqlItem = dbManager.addItemToSection(sqlTmpl.id, sqlSec.id, 'Verify CSRF Protection Header', 'Ensure X-CSRF token');
  console.log(`SQLite Added Item: [${sqlItem.id}] "${sqlItem.name}"`);

  // Update Section in SQLite
  dbManager.updateSectionInTemplate(sqlTmpl.id, sqlSec.id, 'SQLite Renamed Security Section');

  // Update Item in SQLite
  dbManager.updateItemInSection(sqlTmpl.id, sqlSec.id, sqlItem.id, 'Verify CSRF & CORS Protection Header', 'Updated note');

  // Verify in SQLite
  const reloadedSqlTmpl = dbManager.getUniversityTemplateById(sqlTmpl.id);
  const checkSqlSec = reloadedSqlTmpl.sections.find(s => s.id === sqlSec.id);
  if (!checkSqlSec || checkSqlSec.title !== 'SQLite Renamed Security Section' || checkSqlSec.items[0].name !== 'Verify CSRF & CORS Protection Header') {
    throw new Error(`SQLite verification failed: ${JSON.stringify(checkSqlSec)}`);
  }
  console.log('SQLite Template Sections and Items verified successfully!');

  // Create session in SQLite from modified template
  const sqlSession = dbManager.createSession('SQLite Test Run', 'Tester Sam', 'QA', '', sqlTmpl.id, 'acquisition');
  const hasSqlCustomSection = sqlSession.items.some(i => i.section_title === 'SQLite Renamed Security Section');
  if (!hasSqlCustomSection) {
    throw new Error('SQLite session items did not include custom section!');
  }
  console.log(`SQLite Session inherited custom section! Total items: ${sqlSession.items.length}`);

  console.log('\n=== ALL HEADING CHECKLIST TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
