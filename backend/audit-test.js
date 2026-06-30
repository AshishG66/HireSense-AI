const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('Starting API Verification Audit...\n');
  let passed = 0;
  let failed = 0;

  const endpoints = [
    { method: 'GET', url: '/health' },
    { method: 'POST', url: '/auth/login', payload: { email: 'fake@example.com', password: 'wrong' }, expectedStatus: 401 },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Testing ${ep.method} ${ep.url}...`);
      const res = await axios({
        method: ep.method,
        url: `${BASE_URL}${ep.url}`,
        data: ep.payload,
        validateStatus: () => true // resolve all statuses
      });

      if (ep.expectedStatus && res.status !== ep.expectedStatus) {
        console.error(`❌ FAILED: Expected ${ep.expectedStatus}, got ${res.status}`);
        failed++;
      } else if (!ep.expectedStatus && res.status >= 400 && res.status !== 401 && res.status !== 403) {
        // Unhandled 500s or 404s
        console.error(`❌ FAILED: Got status ${res.status}`);
        failed++;
      } else {
        console.log(`✅ PASSED (${res.status})`);
        passed++;
      }
    } catch (err) {
      console.error(`❌ ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nAudit Complete: ${passed} passed, ${failed} failed.`);
}

runTests();
