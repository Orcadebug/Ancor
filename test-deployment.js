#!/usr/bin/env node

/**
 * Deployment Test Script
 * Tests your Vercel + Railway + Supabase integration
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🧪 Testing AI Infrastructure Platform Deployment\n');

// Test function
async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === 200;
        console.log(`${success ? '✅' : '❌'} ${description}`);
        if (success) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${json.message || json.success || 'OK'}`);
          } catch (e) {
            console.log(`   Response: ${res.statusCode} ${res.statusMessage}`);
          }
        } else {
          console.log(`   Error: ${res.statusCode} ${res.statusMessage}`);
        }
        resolve(success);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${description}`);
      console.log(`   Error: Request timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

// Main test function
async function runTests() {
  console.log('Backend URL:', BACKEND_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('');
  
  const tests = [
    // Backend tests
    [`${BACKEND_URL}/health`, 'Backend Health Check'],
    [`${BACKEND_URL}/`, 'Backend Root Endpoint'],
    [`${BACKEND_URL}/api/dashboard/stats/test-org`, 'Dashboard Stats API'],
    [`${BACKEND_URL}/api/deployments/organization/test-org`, 'Deployments API'],
    [`${BACKEND_URL}/api/billing/summary/test-org`, 'Billing API'],
    
    // Frontend test (basic connectivity)
    [`${FRONTEND_URL}`, 'Frontend Accessibility']
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [url, description] of tests) {
    const success = await testEndpoint(url, description);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your deployment is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  // Additional deployment tips
  console.log('\n💡 Next Steps:');
  console.log('   1. Test authentication by visiting the frontend');
  console.log('   2. Try the deployment wizard');
  console.log('   3. Check browser console for any errors');
  console.log('   4. Monitor Railway and Vercel logs');
}

// Run tests
runTests().catch(console.error);