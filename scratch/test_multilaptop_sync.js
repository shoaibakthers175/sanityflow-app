const http = require('http');
const path = require('path');
const fs = require('fs');

async function runMultiLaptopSyncTest() {
  console.log('=== MULTI-LAPTOP REAL-TIME SERVER SYNCHRONIZATION TEST ===\n');

  // 1. Require and start the server on a test port
  const { app, server } = require('../server.js');
  const TEST_PORT = 10005;

  await new Promise((resolve) => {
    // If server is already listening, close and re-bind to test port
    server.close(() => {
      app.listen(TEST_PORT, '127.0.0.1', () => {
        console.log(`[TEST SERVER] Active on port ${TEST_PORT}`);
        resolve();
      });
    });
  });

  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  // Helper request function
  async function request(endpoint, options = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    return await res.json();
  }

  // --- SIMULATING LAPTOP 1 ---
  console.log('--- [LAPTOP 1]: QA Tester on Laptop 1 logs in ---');
  const loginLaptop1 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'acq_user', password: 'acq123' })
  });
  console.log(`1. Laptop 1 Login: ${loginLaptop1.success ? 'SUCCESS' : 'FAILED'} as ${loginLaptop1.user?.username} (${loginLaptop1.user?.vertical})`);
  if (!loginLaptop1.success) throw new Error('Laptop 1 login failed');

  // Laptop 1 gets Acquisition templates
  const acqTemplates = await request('/api/templates?vertical=acquisition');
  console.log(`2. Laptop 1 retrieved ${acqTemplates.length} templates.`);
  const targetTmpl = acqTemplates[0];

  // Laptop 1 adds a new heading checklist section
  console.log('3. Laptop 1 adds custom Section Header: "Multi-Laptop Cloud Ingestion Header"');
  const newSec = await request(`/api/templates/${targetTmpl.id}/sections`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Multi-Laptop Cloud Ingestion Header' })
  });
  console.log(`   Section created with ID: ${newSec.id}`);

  // Laptop 1 adds items under the new section
  console.log('4. Laptop 1 adds 2 checklist items under new header');
  const item1 = await request(`/api/templates/${targetTmpl.id}/sections/${newSec.id}/items`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Verify Webhook Payload Delivery across VPC', defaultNotes: 'Payload verification' })
  });
  const item2 = await request(`/api/templates/${targetTmpl.id}/sections/${newSec.id}/items`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Verify Redis Ingestion Queue Latency', defaultNotes: 'Max 50ms latency' })
  });
  console.log(`   Created items: "${item1.name}" and "${item2.name}"`);

  // Laptop 1 creates a new checklist run
  console.log('5. Laptop 1 creates new Sanity Checklist Run "Fall 2026 Multi-Device Smoke Test"');
  const session1 = await request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      projectName: 'Fall 2026 Multi-Device Smoke Test',
      testerName: 'Laptop 1 QA Engineer',
      environment: 'Staging',
      notes: 'Executed from Laptop 1',
      universityTemplateId: targetTmpl.id,
      vertical: 'acquisition'
    })
  });
  console.log(`   Session created [ID: ${session1.id}] with ${session1.items?.length} items`);

  // Laptop 1 updates status of item 1 to passed
  const sessionItem1 = session1.items.find(i => i.item_name === 'Verify Webhook Payload Delivery across VPC') || session1.items[0];
  await request(`/api/items/${sessionItem1.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'passed', notes: 'Verified OK on Laptop 1' })
  });
  console.log('6. Laptop 1 updated item status to "passed"');

  // --- SIMULATING LAPTOP 2 (DIFFERENT LAPTOP / BROWSER) ---
  console.log('\n--- [LAPTOP 2]: Second QA Lead opens SanityFlow on another Laptop ---');
  
  // Laptop 2 logs in
  const loginLaptop2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  console.log(`7. Laptop 2 Login: ${loginLaptop2.success ? 'SUCCESS' : 'FAILED'} as ${loginLaptop2.user?.username}`);
  if (!loginLaptop2.success) throw new Error('Laptop 2 login failed');

  // Laptop 2 fetches Acquisition templates
  console.log('8. Laptop 2 fetches Acquisition Templates from server...');
  const laptop2Tmpls = await request('/api/templates?vertical=acquisition');
  const laptop2Target = laptop2Tmpls.find(t => t.id === targetTmpl.id);
  const foundSecOnLaptop2 = laptop2Target.sections.find(s => s.id === newSec.id);

  if (!foundSecOnLaptop2) {
    throw new Error('FAILED: Laptop 2 did NOT see the section header created by Laptop 1!');
  }
  console.log(`   ✓ SUCCESS: Laptop 2 sees Section Header "${foundSecOnLaptop2.title}" with ${foundSecOnLaptop2.items.length} checks!`);

  const foundItemOnLaptop2 = foundSecOnLaptop2.items.find(i => i.name === 'Verify Webhook Payload Delivery across VPC');
  if (!foundItemOnLaptop2) {
    throw new Error('FAILED: Laptop 2 did NOT see checklist items created on Laptop 1!');
  }
  console.log(`   ✓ SUCCESS: Laptop 2 sees item "${foundItemOnLaptop2.name}"`);

  // Laptop 2 fetches sessions and dashboard stats
  console.log('9. Laptop 2 fetches Sessions and Dashboard Stats...');
  const laptop2Sessions = await request('/api/sessions?vertical=acquisition');
  const foundSessionOnLaptop2 = laptop2Sessions.find(s => s.id === session1.id);
  if (!foundSessionOnLaptop2) {
    throw new Error('FAILED: Laptop 2 did NOT see the session created on Laptop 1!');
  }
  console.log(`   ✓ SUCCESS: Laptop 2 retrieved session "${foundSessionOnLaptop2.project_name}" with stats:`, foundSessionOnLaptop2.stats);

  const laptop2Stats = await request('/api/stats?vertical=acquisition');
  console.log(`   ✓ SUCCESS: Laptop 2 retrieved live dashboard metrics:`, {
    totalProjects: laptop2Stats.totalProjects,
    passRate: `${laptop2Stats.passRate}%`,
    passedItems: laptop2Stats.itemStats.passed
  });

  // --- LAPTOP 2 MAKES CHANGES -> LAPTOP 1 SEES THEM ---
  console.log('\n10. Laptop 2 deletes item 2 and renames section on Laptop 2...');
  await request(`/api/templates/${targetTmpl.id}/sections/${newSec.id}/items/${item2.id}`, {
    method: 'DELETE'
  });
  await request(`/api/templates/${targetTmpl.id}/sections/${newSec.id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Multi-Laptop Cloud Ingestion Header (Laptop 2 Verified)' })
  });

  // Laptop 1 fetches updated template
  console.log('11. Laptop 1 fetches template from server...');
  const laptop1Refreshed = await request(`/api/templates/${targetTmpl.id}`);
  const finalSec = laptop1Refreshed.sections.find(s => s.id === newSec.id);
  if (finalSec.title !== 'Multi-Laptop Cloud Ingestion Header (Laptop 2 Verified)') {
    throw new Error('FAILED: Laptop 1 did not see title change made on Laptop 2');
  }
  if (finalSec.items.some(i => i.id === item2.id)) {
    throw new Error('FAILED: Laptop 1 still sees item deleted by Laptop 2');
  }
  console.log('   ✓ SUCCESS: Laptop 1 accurately received all real-time edits made by Laptop 2!');

  console.log('\n=== ALL MULTI-DEVICE SYNCHRONIZATION TESTS PASSED 100%! ===');
  process.exit(0);
}

runMultiLaptopSyncTest().catch(err => {
  console.error('Multi-laptop sync test failed:', err);
  process.exit(1);
});
