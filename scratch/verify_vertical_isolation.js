const path = require('path');
const fs = require('fs');

async function testVerticalIsolation() {
  console.log('=== TEST 1: Database Initialization & Migrations ===');
  const dbManager = require('../electron/db/database');
  const testDataDir = path.join(__dirname, 'test_db');
  
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }

  await dbManager.initialize(testDataDir);
  console.log('✅ SQLite database initialized successfully at test directory.');

  console.log('\n=== TEST 2: Seeded Vertical Accounts Verification ===');
  const users = dbManager.getAllUsers();
  console.log(`Found ${users.length} seeded users:`);
  users.forEach(u => console.log(` - @${u.username} (${u.full_name}) | Role: ${u.role} | Vertical: ${u.vertical}`));
  
  if (users.length < 5) throw new Error('Expected at least 5 default users');
  console.log('✅ Default vertical users seeded correctly.');

  console.log('\n=== TEST 3: Login Verification with Vertical Credentials ===');
  const loginAcq = await dbManager.loginUser('acq_user', 'acq123');
  console.log('Acquisition login:', loginAcq.success ? `SUCCESS (Vertical: ${loginAcq.user.vertical})` : 'FAILED');
  if (!loginAcq.success || loginAcq.user.vertical !== 'acquisition') throw new Error('Acquisition login failed');

  const loginLms = await dbManager.loginUser('lms_user', 'lms123');
  console.log('LMS login:', loginLms.success ? `SUCCESS (Vertical: ${loginLms.user.vertical})` : 'FAILED');
  if (!loginLms.success || loginLms.user.vertical !== 'lms') throw new Error('LMS login failed');

  const loginAdmin = await dbManager.loginUser('admin', 'admin123');
  console.log('Admin login:', loginAdmin.success ? `SUCCESS (Role: ${loginAdmin.user.role})` : 'FAILED');
  if (!loginAdmin.success || loginAdmin.user.role !== 'admin') throw new Error('Admin login failed');

  console.log('\n=== TEST 4: Vertical Data Isolation Check ===');
  // Create an Acquisition session
  const acqSession = dbManager.createSession('Fall 2026 Admissions Portal Sanity', 'Acq QA Lead', 'QA', 'Testing lead sync', null, 'acquisition');
  console.log(`Created Acquisition checklist session (ID: ${acqSession.id}, Items: ${acqSession.items.length})`);

  // Query sessions for Acquisition
  const acqSessionsList = dbManager.getSessions('', '', 'ALL', 'acquisition');
  console.log(`Acquisition sessions count: ${acqSessionsList.length}`);
  if (acqSessionsList.length !== 1) throw new Error('Expected 1 session in acquisition');

  // Query sessions for LMS
  const lmsSessionsList = dbManager.getSessions('', '', 'ALL', 'lms');
  console.log(`LMS sessions count: ${lmsSessionsList.length} (Expected: 0)`);
  if (lmsSessionsList.length !== 0) throw new Error('Data leak: LMS can see Acquisition session!');

  // Query stats for LMS vs Acquisition
  const acqStats = dbManager.getDashboardStats('acquisition');
  const lmsStats = dbManager.getDashboardStats('lms');
  console.log(`Acquisition Total Projects: ${acqStats.totalProjects}, Total Items: ${acqStats.itemStats.total}`);
  console.log(`LMS Total Projects: ${lmsStats.totalProjects}, Total Items: ${lmsStats.itemStats.total}`);
  if (acqStats.totalProjects !== 1 || lmsStats.totalProjects !== 0) throw new Error('Stats isolation failed');

  console.log('✅ Strict vertical data isolation verified between Acquisition and LMS.');

  console.log('\n=== TEST 5: Admin User Provisioning ===');
  const createRes = dbManager.createUser('exam_proctor_99', 'securePass99', 'Senior Proctor Lead', 'qa_lead', 'exam-portal');
  console.log('Admin user creation result:', createRes.success ? `SUCCESS (ID: ${createRes.user.id})` : 'FAILED');
  if (!createRes.success) throw new Error('Failed to create new user');

  const loginNewUser = await dbManager.loginUser('exam_proctor_99', 'securePass99');
  console.log('New user login:', loginNewUser.success ? `SUCCESS (Vertical: ${loginNewUser.user.vertical})` : 'FAILED');
  if (!loginNewUser.success || loginNewUser.user.vertical !== 'exam-portal') throw new Error('New user login failed');

  // Cleanup test user
  const delRes = dbManager.deleteUser(createRes.user.id);
  console.log('Delete test user result:', delRes.success ? 'SUCCESS' : 'FAILED');

  // Clean test dir
  fs.rmSync(testDataDir, { recursive: true, force: true });
  console.log('\n🎉 ALL MULTI-VERTICAL & AUTH TESTS PASSED PERFECTLY!');
}

testVerticalIsolation().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
