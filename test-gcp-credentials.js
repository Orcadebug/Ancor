#!/usr/bin/env node

// Test script to verify GCP credentials are working
require('dotenv').config();

console.log('🔧 Testing GCP Credentials...\n');

// Check environment variables
console.log('Environment Variables:');
console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`GCP_SERVICE_ACCOUNT_EMAIL: ${process.env.GCP_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Missing'}`);
console.log(`GCP_KEY_FILE: ${process.env.GCP_KEY_FILE ? '✅ Set' : '❌ Missing'}`);
console.log(`GCP_REGION: ${process.env.GCP_REGION || 'us-central1 (default)'}\n`);

if (!process.env.GCP_PROJECT_ID) {
  console.log('❌ GCP_PROJECT_ID is missing!');
  process.exit(1);
}

if (!process.env.GCP_KEY_FILE) {
  console.log('❌ GCP_KEY_FILE is missing!');
  process.exit(1);
}

// Test GCP authentication
async function testGCPAuth() {
  try {
    const { GoogleAuth } = require('google-auth-library');
    
    console.log('🔐 Testing GCP Authentication...');
    
    const auth = new GoogleAuth({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.admin'
      ]
    });
    
    const authClient = await auth.getClient();
    console.log('✅ GCP Authentication successful!');
    
    // Test Cloud Run access
    const { CloudRunServiceClient } = require('@google-cloud/run');
    const cloudRun = new CloudRunServiceClient({
      projectId: process.env.GCP_PROJECT_ID,
      authClient
    });
    
    const parent = `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_REGION || 'us-central1'}`;
    const [services] = await cloudRun.listServices({ parent });
    
    console.log(`✅ Cloud Run API access successful! Found ${services.length} services.`);
    console.log('🎉 GCP credentials are working correctly!');
    
  } catch (error) {
    console.error('❌ GCP Authentication failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testGCPAuth();