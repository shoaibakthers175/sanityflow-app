const dbManager = require('../electron/db/database.js');
const path = require('path');
const fs = require('fs');

async function runVerification() {
  console.log('--- Starting SanityFlow University Template Verification ---');

  const testDbDir = path.join(__dirname, 'test_data');
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  await dbManager.initialize(testDbDir);
  console.log('1. SQLite DB initialized successfully');

  // 1. Get all university templates
  const templates = dbManager.getUniversityTemplates();
  console.log(`2. Retrieved ${templates.length} university templates:`);
  templates.forEach(t => {
    console.log(`   - [ID: ${t.id}] ${t.name} (Default: ${t.is_default}) with ${t.sections.length} sections`);
    t.sections.forEach(s => {
      console.log(`       * Section: "${s.title}" (${s.items.length} checklist items)`);
    });
  });

  if (templates.length < 3) {
    throw new Error('Expected at least 3 seeded university templates');
  }

  // 2. Create custom university template
  const customTmpl = dbManager.createUniversityTemplate('Stanford Axess Student Portal', 'Sanity verification for Stanford Axess course registration');
  console.log(`3. Created Custom Template: [ID: ${customTmpl.id}] ${customTmpl.name}`);

  // 3. Add custom section header to template
  const section1 = dbManager.addSectionToTemplate(customTmpl.id, 'Axess Course Enrollment');
  console.log(`4. Added section header: "${section1.title}"`);

  // 4. Add items to section
  const item1 = dbManager.addItemToSection(customTmpl.id, section1.id, 'Verify Stanford Single Sign-On & Duo Auth', 'Ensure Duo prompt displays');
  const item2 = dbManager.addItemToSection(customTmpl.id, section1.id, 'Verify Course Drop/Add Deadline Constraints', 'Test past-deadline drop block');
  console.log(`5. Added 2 checklist items to section: "${item1.name}", "${item2.name}"`);

  // 5. Create a session using this Stanford template
  const session = dbManager.createSession(
    'Stanford Fall 2026 Axess Release',
    'Alex QA Lead',
    'Staging / Pre-Prod',
    'Testing Fall quarter registration load',
    customTmpl.id
  );
  console.log(`6. Created Session [ID: ${session.id}] using template "${session.university_name}" with ${session.items.length} items`);

  // 6. Verify section_title grouping in session
  const itemSecs = new Set(session.items.map(i => i.section_title));
  console.log(`7. Session items section groups:`, Array.from(itemSecs));

  // 7. Update status of items
  dbManager.updateItem(session.items[0].id, { status: 'passed', notes: 'Duo MFA verified successfully' });
  const updatedSession = dbManager.getSessionById(session.id);
  console.log(`8. Updated item status to passed. Session stats:`, updatedSession.stats);

  // 8. Test guidelines update and fetch
  const testGuidelines = {
    stagingUrl: 'https://axess.staging.stanford.edu',
    vpnRequired: true,
    vpnNotes: 'Stanford VPN required for Axess admin portal',
    testAccounts: [
      { role: 'Stanford Student', username: 'stanford_student_01@stanford.edu', password: 'StanfordTree#2026', notes: 'Undergraduate student in CS' }
    ],
    prerequisites: ['Verify Duo push sandbox is enabled']
  };
  dbManager.updateUniversityGuidelines(customTmpl.id, testGuidelines);
  const reloadedTmpl = dbManager.getUniversityTemplateById(customTmpl.id);
  console.log('9. Updated & Verified Guidelines:', reloadedTmpl.guidelines);

  // 9. Test PDF Service generation
  const pdfService = require('../electron/services/pdfService.js');
  const testPdfPath = path.join(testDbDir, 'test_university_report.pdf');
  const pdfResult = await pdfService.generatePDF(updatedSession, testPdfPath);
  console.log(`10. PDF Generation Result:`, pdfResult);

  if (fs.existsSync(testPdfPath)) {
    const stat = fs.statSync(testPdfPath);
    console.log(`11. PDF Generated successfully! Size: ${stat.size} bytes at ${testPdfPath}`);
  } else {
    throw new Error('PDF file was not created');
  }

  console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
