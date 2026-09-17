const path = require('path');
const fs = require('fs');

async function testEnvironmentUrlsIsolation() {
  console.log('=== STARTING DEV / VENUS / PROD URL ISOLATION TEST ===');

  const testDbDir = path.join(__dirname, 'test_db_urls_' + Date.now());
  fs.mkdirSync(testDbDir, { recursive: true });

  const dbManager = require('../electron/db/database');
  await dbManager.initialize(testDbDir);

  const verticals = ['acquisition', 'lms', 'exam-portal', 'erp'];

  // 1. Verify all 4 verticals have their own dedicated URLs
  console.log('\n[TEST 1] Verifying default environment URLs per vertical:');
  const defaultUrls = {};
  verticals.forEach(v => {
    const tmpl = dbManager.getUniversityTemplates(v)[0];
    defaultUrls[v] = {
      devUrl: tmpl.guidelines.devUrl,
      venusUrl: tmpl.guidelines.venusUrl,
      prodUrl: tmpl.guidelines.prodUrl,
    };
    console.log(`[${v.toUpperCase()}]`);
    console.log(`  DEV:   ${tmpl.guidelines.devUrl}`);
    console.log(`  VENUS: ${tmpl.guidelines.venusUrl}`);
    console.log(`  PROD:  ${tmpl.guidelines.prodUrl}`);

    if (!tmpl.guidelines.devUrl || !tmpl.guidelines.venusUrl || !tmpl.guidelines.prodUrl) {
      throw new Error(`Missing one or more URLs for vertical: ${v}`);
    }
  });

  // Verify all URLs are unique to their vertical
  const allUrls = Object.values(defaultUrls).flatMap(u => [u.devUrl, u.venusUrl, u.prodUrl]);
  const uniqueUrls = new Set(allUrls);
  if (allUrls.length !== uniqueUrls.size) {
    throw new Error('Duplicate URLs detected across different verticals!');
  }
  console.log('✓ All 4 verticals have distinct Dev, Venus, and Prod URLs.');

  // 2. Modify LMS URLs
  console.log('\n[TEST 2] Modifying LMS Dev, Venus, and Prod URLs...');
  const lmsTmpl = dbManager.getUniversityTemplates('lms')[0];
  const customLmsGuidelines = {
    ...lmsTmpl.guidelines,
    devUrl: 'https://custom-dev.lms.exclusive.org',
    venusUrl: 'https://custom-venus.lms.exclusive.org',
    prodUrl: 'https://custom-prod.lms.exclusive.org',
  };

  dbManager.updateUniversityGuidelines(lmsTmpl.id, customLmsGuidelines);

  const updatedLms = dbManager.getUniversityTemplateById(lmsTmpl.id);
  console.log(`Updated LMS DEV:   ${updatedLms.guidelines.devUrl}`);
  console.log(`Updated LMS VENUS: ${updatedLms.guidelines.venusUrl}`);
  console.log(`Updated LMS PROD:  ${updatedLms.guidelines.prodUrl}`);

  if (
    updatedLms.guidelines.devUrl !== 'https://custom-dev.lms.exclusive.org' ||
    updatedLms.guidelines.venusUrl !== 'https://custom-venus.lms.exclusive.org' ||
    updatedLms.guidelines.prodUrl !== 'https://custom-prod.lms.exclusive.org'
  ) {
    throw new Error('LMS guidelines did not save updated URLs!');
  }

  // 3. Check Acquisition, Exam Portal, ERP - MUST BE COMPLETELY UNTOUCHED
  console.log('\n[TEST 3] Verifying Acquisition, Exam Portal, ERP are 100% UNTOUCHED:');
  ['acquisition', 'exam-portal', 'erp'].forEach(v => {
    const tmpl = dbManager.getUniversityTemplates(v)[0];
    console.log(`Checking ${v.toUpperCase()}...`);
    if (tmpl.guidelines.devUrl !== defaultUrls[v].devUrl) {
      throw new Error(`Conflict! ${v} devUrl was corrupted by LMS change!`);
    }
    if (tmpl.guidelines.venusUrl !== defaultUrls[v].venusUrl) {
      throw new Error(`Conflict! ${v} venusUrl was corrupted by LMS change!`);
    }
    if (tmpl.guidelines.prodUrl !== defaultUrls[v].prodUrl) {
      throw new Error(`Conflict! ${v} prodUrl was corrupted by LMS change!`);
    }
  });
  console.log('✓ PASS: Zero merge conflict or leakage across other verticals.');

  // 4. Modify Acquisition URLs as well
  console.log('\n[TEST 4] Modifying Acquisition Dev, Venus, and Prod URLs...');
  const acqTmpl = dbManager.getUniversityTemplates('acquisition')[0];
  dbManager.updateUniversityGuidelines(acqTmpl.id, {
    ...acqTmpl.guidelines,
    devUrl: 'https://admissions-dev.mycampus.edu',
    venusUrl: 'https://admissions-venus.mycampus.edu',
    prodUrl: 'https://admissions.mycampus.edu'
  });

  const updatedAcq = dbManager.getUniversityTemplateById(acqTmpl.id);
  const recheckLms = dbManager.getUniversityTemplateById(lmsTmpl.id);

  if (updatedAcq.guidelines.devUrl !== 'https://admissions-dev.mycampus.edu') {
    throw new Error('Acquisition URLs failed to update!');
  }
  if (recheckLms.guidelines.devUrl !== 'https://custom-dev.lms.exclusive.org') {
    throw new Error('LMS URLs were corrupted by Acquisition update!');
  }
  console.log('✓ PASS: Both Acquisition and LMS maintain their separate, customized URLs simultaneously.');

  // Cleanup test DB
  try {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  } catch {}

  console.log('\n=== ALL ENVIRONMENT URL TESTS PASSED WITH 100% SUCCESS ===');
}

testEnvironmentUrlsIsolation().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
