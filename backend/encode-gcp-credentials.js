#!/usr/bin/env node
/**
 * Encode GCP Credentials for Railway
 * This creates a base64 encoded version that won't get truncated
 */

const fs = require('fs');

// Read the original JSON file - UPDATE THIS TO YOUR NEW KEY FILE
const keyFile = 'ai-infrastructure-platform-ab0d21dc8cd2.json';

if (!fs.existsSync(keyFile)) {
  console.log('❌ Key file not found. Please place your GCP service account key file in this directory.');
  process.exit(1);
}

try {
  const keyContent = fs.readFileSync(keyFile, 'utf8');
  const credentials = JSON.parse(keyContent);
  
  // Encode to base64
  const base64Credentials = Buffer.from(keyContent).toString('base64');
  
  console.log('🔧 GCP Credentials Encoder for Railway\n');
  console.log('✅ Original JSON parsed successfully');
  console.log(`   Project ID: ${credentials.project_id}`);
  console.log(`   Client Email: ${credentials.client_email}`);
  console.log(`   Original size: ${keyContent.length} characters`);
  console.log(`   Base64 size: ${base64Credentials.length} characters\n`);
  
  console.log('🚀 Railway Environment Variables (Base64 Encoded):');
  console.log('Copy and paste these into your Railway project variables:\n');
  
  console.log('```');
  console.log(`GCP_PROJECT_ID=${credentials.project_id}`);
  console.log(`GCP_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}`);
  console.log(`GCP_KEY_FILE_BASE64=${base64Credentials}`);
  console.log('GCP_REGION=us-central1');
  console.log('```');
  
  console.log('\n📋 Step-by-step instructions:');
  console.log('1. Go to https://railway.app/dashboard');
  console.log('2. Select your ancor-production project');
  console.log('3. Go to the "Variables" tab');
  console.log('4. Add each environment variable above');
  console.log('5. Save and redeploy');
  
  console.log('\n🧪 After setting the variables, test with:');
  console.log('curl https://ancor-production.up.railway.app/api/test-gcp');
  
} catch (error) {
  console.error('❌ Error processing key file:', error.message);
  process.exit(1);
}