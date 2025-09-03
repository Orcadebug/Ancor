#!/usr/bin/env node

/**
 * Azure Integration Test Script
 * Tests your Azure deployment functionality
 */

const https = require('https');
const http = require('http');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_ORG_ID = 'test-org-123';

console.log('🧪 Testing Azure AI Infrastructure Platform Integration\n');

// Test functions
async function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = protocol.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`${success ? '✅' : '❌'} ${method} ${url}`);
        
        if (success) {
          try {
            const json = JSON.parse(responseData);
            console.log(`   Response: ${json.message || json.success || 'OK'}`);
            resolve({ success: true, data: json });
          } catch (e) {
            console.log(`   Response: ${res.statusCode} ${res.statusMessage}`);
            resolve({ success: true, data: responseData });
          }
        } else {
          console.log(`   Error: ${res.statusCode} ${res.statusMessage}`);
          resolve({ success: false, error: responseData });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${method} ${url}`);
      console.log(`   Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFileUpload(url, filePath) {
  return new Promise((resolve) => {
    const form = new FormData();
    
    // Create a test file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'This is a test document for AI processing.\n\nIt contains sample content that the AI can analyze and respond to questions about.');
    }
    
    form.append('file', fs.createReadStream(filePath));
    form.append('deploymentId', 'test-deployment');
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: 'POST',
      headers: form.getHeaders()
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`${success ? '✅' : '❌'} POST ${url} (file upload)`);
        
        if (success) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${json.message || 'File uploaded successfully'}`);
            resolve({ success: true, data: json });
          } catch (e) {
            console.log(`   Response: File uploaded`);
            resolve({ success: true, data });
          }
        } else {
          console.log(`   Error: ${res.statusCode} ${res.statusMessage}`);
          resolve({ success: false, error: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ POST ${url} (file upload)`);
      console.log(`   Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    form.pipe(req);
  });
}

// Main test function
async function runTests() {
  console.log('Backend URL:', BACKEND_URL);
  console.log('Test Org ID:', TEST_ORG_ID);
  console.log('');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Health check
  total++;
  const health = await testEndpoint(`${BACKEND_URL}/health`);
  if (health.success) passed++;
  
  // Test 2: Dashboard stats
  total++;
  const stats = await testEndpoint(`${BACKEND_URL}/api/dashboard/stats/${TEST_ORG_ID}`);
  if (stats.success) passed++;
  
  // Test 3: Create deployment (REAL AZURE DEPLOYMENT)
  total++;
  console.log('\n🚀 Testing REAL Azure deployment creation...');
  const deployment = await testEndpoint(`${BACKEND_URL}/api/deployments`, 'POST', {
    name: 'Test AI Deployment',
    industry: 'legal',
    model: 'llama-3-8b',
    provider: 'azure',
    orgId: TEST_ORG_ID
  });
  if (deployment.success) {
    passed++;
    console.log('   ⚠️  Real Azure resources are being created!');
    console.log('   💰 This will use your Azure student credits');
    
    // Wait a bit for deployment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Check deployment status
    if (deployment.data.deployment) {
      total++;
      const status = await testEndpoint(`${BACKEND_URL}/api/deployments/${deployment.data.deployment.id}`);
      if (status.success) passed++;
    }
  }
  
  // Test 5: Document upload (REAL AZURE STORAGE)
  total++;
  console.log('\n📄 Testing REAL document upload to Azure...');
  const upload = await testFileUpload(`${BACKEND_URL}/api/documents/upload`, './test-document.txt');
  if (upload.success) {
    passed++;
    console.log('   ⚠️  Document uploaded to real Azure Blob Storage!');
  }
  
  // Test 6: AI Chat (REAL AI RESPONSES)
  total++;
  console.log('\n💬 Testing REAL AI chat...');
  const chat = await testEndpoint(`${BACKEND_URL}/api/chat`, 'POST', {
    message: 'What is this document about?',
    deploymentId: 'test-deployment'
  });
  if (chat.success) {
    passed++;
    console.log('   🤖 Real AI response generated!');
  }
  
  // Test 7: Get deployments
  total++;
  const deployments = await testEndpoint(`${BACKEND_URL}/api/deployments/organization/${TEST_ORG_ID}`);
  if (deployments.success) passed++;
  
  // Test 8: Get documents
  total++;
  const documents = await testEndpoint(`${BACKEND_URL}/api/documents/organization/${TEST_ORG_ID}`);
  if (documents.success) passed++;
  
  // Test 9: Billing summary
  total++;
  const billing = await testEndpoint(`${BACKEND_URL}/api/billing/summary/${TEST_ORG_ID}`);
  if (billing.success) passed++;
  
  // Results
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your Azure integration is working!');
    console.log('\n✅ What this means:');
    console.log('   - Real Azure resources are being created');
    console.log('   - Documents are stored in Azure Blob Storage');
    console.log('   - AI models are responding to queries');
    console.log('   - Your platform can deploy real infrastructure');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Check Azure Portal for created resources');
  console.log('   2. Monitor your Azure student credit usage');
  console.log('   3. Test the full flow via your frontend');
  console.log('   4. Demo to potential customers!');
  
  console.log('\n🔗 Useful Links:');
  console.log('   - Azure Portal: https://portal.azure.com');
  console.log('   - Resource Group: ai-platform-rg');
  console.log('   - Your Backend: ' + BACKEND_URL);
  
  // Cleanup reminder
  console.log('\n🧹 Cleanup Reminder:');
  console.log('   Delete test resources in Azure Portal to save credits');
  console.log('   Or run: az group delete --name ai-platform-rg');
}

// Run tests
runTests().catch(console.error);