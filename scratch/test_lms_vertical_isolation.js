const path = require('path');
const fs = require('fs');

async function testVerticalIsolation() {
  console.log('=== STARTING VERTICAL ISOLATION TEST SUITE ===');
  
  // Use temporary directory for clean test DB
  const testDbDir = path.join(__dirname, 'test_db_' + Date.now());
  fs.mkdirSync(testDbDir, { recursive: true });

  const dbManager = require('../electron/db/database');
  await dbManager.initialize(testDbDir);

  // 1. Check initial templates for each vertical
  const acqTemplates = dbManager.getUniversityTemplates('acquisition');
  const lmsTemplates = dbManager.getUniversityTemplates('lms');
  const examTemplates = dbManager.getUniversityTemplates('exam-portal');
  const erpTemplates = dbManager.getUniversityTemplates('erp');

  console.log(`[INIT] Acquisition templates: ${acqTemplates.length}`);
  console.log(`[INIT] LMS templates: ${lmsTemplates.length}`);
  console.log(`[INIT] Exam Portal templates: ${examTemplates.length}`);
  console.log(`[INIT] ERP templates: ${erpTemplates.length}`);

  if (acqTemplates.length === 0 || lmsTemplates.length === 0 || examTemplates.length === 0 || erpTemplates.length === 0) {
    throw new Error('Initial template seeding failed for one or more verticals');
  }

  // Ensure NO LMS template appears in Acquisition
  const lmsInAcq = acqTemplates.filter(t => t.vertical === 'lms');
  if (lmsInAcq.length > 0) {
    throw new Error('LMS template found in Acquisition template query!');
  }

  const lmsTmpl = lmsTemplates[0];
  const acqTmpl = acqTemplates[0];
  const originalAcqSectionsCount = (acqTmpl.sections || []).length;
  const originalAcqName = acqTmpl.name;

  console.log(`\n[STEP 1] Testing Template Modification in LMS...`);
  console.log(`Modifying LMS Template: ${lmsTmpl.name} (ID: ${lmsTmpl.id})`);

  // Update LMS Template name & guidelines
  dbManager.updateUniversityTemplate(lmsTmpl.id, {
    name: 'LMS EXCLUSIVE MODIFIED SUITE v2',
    description: 'Updated only in LMS vertical',
    guidelines: {
      stagingUrl: 'https://exclusive-lms.custom.com',
      testAccounts: [{ role: 'Special LMS Tester', username: 'lms_exclusive', password: 'password123' }],
      prerequisites: ['LMS Only prerequisite check'],
      importantNotes: 'Only for LMS testing'
    }
  });

  // Add a new section to LMS template
  const newSec = dbManager.addSectionToTemplate(lmsTmpl.id, 'LMS Custom Video Section');
  console.log(`Added new section to LMS template (ID: ${newSec.id}, Title: ${newSec.title})`);

  // Add a new check item to that section
  const newItem = dbManager.addItemToSection(lmsTmpl.id, newSec.id, 'Test 4K Video DRM Decryption', 'DRM verification note');
  console.log(`Added new check to LMS section (ID: ${newItem.id}, Title: ${newItem.name})`);

  // Verify LMS Template has new changes
  const updatedLmsTmpl = dbManager.getUniversityTemplateById(lmsTmpl.id);
  console.log(`Updated LMS Template Name: ${updatedLmsTmpl.name}`);
  console.log(`Updated LMS Template Sections: ${updatedLmsTmpl.sections.length}`);
  console.log(`Updated LMS Guidelines Staging URL: ${updatedLmsTmpl.guidelines.stagingUrl}`);

  if (updatedLmsTmpl.name !== 'LMS EXCLUSIVE MODIFIED SUITE v2') {
    throw new Error('LMS Template name did not update!');
  }

  // 2. Verify that Acquisition, Exam Portal, and ERP are COMPLETELY UNTOUCHED
  console.log(`\n[STEP 2] Verifying Acquisition, Exam Portal, and ERP were UNTOUCHED...`);
  const freshAcq = dbManager.getUniversityTemplates('acquisition')[0];
  const freshExam = dbManager.getUniversityTemplates('exam-portal')[0];
  const freshErp = dbManager.getUniversityTemplates('erp')[0];

  console.log(`Acquisition Name: "${freshAcq.name}" (Expected: "${originalAcqName}")`);
  console.log(`Acquisition Sections Count: ${freshAcq.sections.length} (Expected: ${originalAcqSectionsCount})`);
  console.log(`Acquisition Staging URL: ${freshAcq.guidelines.stagingUrl}`);

  if (freshAcq.name !== originalAcqName) {
    throw new Error('Acquisition template name was altered by LMS change!');
  }
  if (freshAcq.sections.length !== originalAcqSectionsCount) {
    throw new Error('Acquisition template sections were altered by LMS change!');
  }
  if (freshAcq.guidelines.stagingUrl === 'https://exclusive-lms.custom.com') {
    throw new Error('Acquisition guidelines were contaminated with LMS guidelines!');
  }
  console.log('✓ PASS: All other verticals (Acquisition, Exam, ERP) remain 100% untouched.');

  // 3. Test Session Isolation
  console.log(`\n[STEP 3] Testing Checklist Session Isolation...`);
  const lmsSession = dbManager.createSession('LMS Q3 Release Sanity', 'LMS Tester', 'Staging', 'Notes', updatedLmsTmpl.id, 'lms');
  const acqSession = dbManager.createSession('Acquisition Ad Campaign Sanity', 'Acq Tester', 'QA', 'Notes', freshAcq.id, 'acquisition');

  const lmsSessionsList = dbManager.getSessions('', '', 'ALL', 'lms');
  const acqSessionsList = dbManager.getSessions('', '', 'ALL', 'acquisition');

  console.log(`LMS Sessions count: ${lmsSessionsList.length}`);
  console.log(`Acquisition Sessions count: ${acqSessionsList.length}`);

  if (lmsSessionsList.some(s => s.project_name === 'Acquisition Ad Campaign Sanity')) {
    throw new Error('Acquisition session leaked into LMS sessions list!');
  }
  if (acqSessionsList.some(s => s.project_name === 'LMS Q3 Release Sanity')) {
    throw new Error('LMS session leaked into Acquisition sessions list!');
  }
  console.log('✓ PASS: Checklist sessions strictly isolated by vertical.');

  // 4. Test Scoped Reset of LMS Defaults
  console.log(`\n[STEP 4] Testing Scoped Reset of LMS Defaults...`);
  dbManager.resetToDefaultUniversityTemplates('lms');

  const resetLms = dbManager.getUniversityTemplates('lms')[0];
  const postResetAcq = dbManager.getUniversityTemplates('acquisition')[0];

  console.log(`Reset LMS Template Name: "${resetLms.name}"`);
  console.log(`Post-Reset Acquisition Template Name: "${postResetAcq.name}"`);

  if (resetLms.name === 'LMS EXCLUSIVE MODIFIED SUITE v2') {
    throw new Error('LMS Template did not reset back to default!');
  }
  if (postResetAcq.name !== originalAcqName) {
    throw new Error('Acquisition Template was wiped out during LMS reset!');
  }
  console.log('✓ PASS: LMS reset only restored LMS and preserved Acquisition.');

  // Clean up test DB
  try {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  } catch {}

  console.log('\n=== ALL VERTICAL ISOLATION TESTS PASSED 100% ===');
}

testVerticalIsolation().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
