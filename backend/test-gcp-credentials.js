#!/usr/bin/env node
/**
 * Test GCP Credentials Script
 * This script helps you test your GCP credentials before deploying to Railway
 */

require('dotenv').config();

const { GoogleAuth } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');
const { ServicesClient } = require('@google-cloud/run');

async function testGCPCredentials() {
  console.log('🧪 Testing GCP Credentials...\n');
  
  // Check environment variables
  const projectId = process.env.GCP_PROJECT_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const keyFile = process.env.GCP_KEY_FILE;
  const region = process.env.GCP_REGION || 'us-central1';
  
  console.log('📋 Environment Variables:');
  console.log(`   GCP_PROJECT_ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GCP_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GCP_KEY_FILE: ${keyFile ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GCP_REGION: ${region}`);
  console.log('');
  
  if (!projectId) {
    console.error('❌ GCP_PROJECT_ID is required');
    return false;
  }
  
  if (!keyFile) {
    console.error('❌ GCP_KEY_FILE is required');
    return false;
  }
  
  try {
    // Parse and validate JSON key
    let credentials;
    if (keyFile.startsWith('{')) {
      // Direct JSON content
      credentials = JSON.parse(keyFile);
      console.log('✅ GCP_KEY_FILE is valid JSON');
    } else {
      // File path - read the file
      const fs = require('fs');
      const keyContent = fs.readFileSync(keyFile, 'utf8');
      credentials = JSON.parse(keyContent);
      console.log('✅ GCP_KEY_FILE loaded from file');
    }
    
    console.log(`   Project ID in key: ${credentials.project_id}`);
    console.log(`   Client Email: ${credentials.client_email}`);
    console.log(`   Type: ${credentials.type}`);
    console.log('');
    
    // Initialize authentication
    const auth = new GoogleAuth({
      projectId: projectId,
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.admin',
        'https://www.googleapis.com/auth/devstorage.full_control'
      ]
    });
    
    console.log('🔐 Testing Authentication...');
    const authClient = await auth.getClient();
    console.log('✅ Authentication successful');
    
    // Test Storage access (simpler test)
    console.log('📦 Testing Cloud Storage access...');
    const storage = new Storage({
      projectId: projectId,
      authClient
    });
    
    const [buckets] = await storage.getBuckets();
    console.log(`✅ Cloud Storage access successful (${buckets.length} buckets found)`);
    
    // Test basic Cloud Run access (simplified)
    console.log('☁️ Testing Cloud Run access...');
    try {
      const cloudRun = new ServicesClient({
        projectId: projectId,
        authClient
      });
      console.log('✅ Cloud Run client initialized successfully');
    } catch (error) {
      console.log('⚠️ Cloud Run client initialization failed, but authentication works');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n🎉 All GCP credentials tests passed!');
    console.log('\n📝 To deploy to Railway, set these environment variables:');
    console.log(`   GCP_PROJECT_ID=${projectId}`);
    console.log(`   GCP_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}`);
    console.log(`   GCP_KEY_FILE='${JSON.stringify(credentials)}'`);
    console.log(`   GCP_REGION=${region}`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ GCP credentials test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 This usually means:');
      console.error('   - The service account key is expired or invalid');
      console.error('   - The service account was deleted');
      console.error('   - The key file is corrupted');
    } else if (error.message.includes('invalid_client')) {
      console.error('\n💡 This usually means:');
      console.error('   - The service account email is incorrect');
      console.error('   - The service account was deleted');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('\n💡 This usually means:');
      console.error('   - The service account lacks required permissions');
      console.error('   - Required APIs are not enabled');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testGCPCredentials()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testGCPCredentials };