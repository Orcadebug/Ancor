#!/usr/bin/env node
/**
 * Format GCP Credentials for Railway
 * This script helps you format your GCP service account key for Railway environment variables
 */

const fs = require('fs');
const path = require('path');

function formatCredentialsForRailway() {
  console.log('🔧 GCP Credentials Formatter for Railway\n');
  
  // Check if service account key file exists
  const keyFiles = [
    'service-account-key.json',
    'gcp-key.json',
    'credentials.json',
    'key.json'
  ];
  
  let keyFilePath = null;
  for (const file of keyFiles) {
    if (fs.existsSync(file)) {
      keyFilePath = file;
      break;
    }
  }
  
  if (!keyFilePath) {
    console.log('❌ No service account key file found.');
    console.log('📁 Looking for files named:');
    keyFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n💡 Please download your service account key JSON file and place it in this directory.');
    console.log('   You can get it from: https://console.cloud.google.com/iam-admin/serviceaccounts');
    return;
  }
  
  try {
    // Read and parse the key file
    const keyContent = fs.readFileSync(keyFilePath, 'utf8');
    const credentials = JSON.parse(keyContent);
    
    console.log('✅ Found service account key file:', keyFilePath);
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Client Email: ${credentials.client_email}`);
    console.log(`   Type: ${credentials.type}`);
    console.log('');
    
    // Format for Railway environment variables
    console.log('🚀 Railway Environment Variables:');
    console.log('Copy and paste these into your Railway project variables:\n');
    
    console.log('```');
    console.log(`GCP_PROJECT_ID=${credentials.project_id}`);
    console.log(`GCP_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}`);
    console.log(`GCP_KEY_FILE='${JSON.stringify(credentials)}'`);
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
    
    // Also create a .env file for local testing
    const envContent = `GCP_PROJECT_ID=${credentials.project_id}
GCP_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}
GCP_KEY_FILE='${JSON.stringify(credentials)}'
GCP_REGION=us-central1
`;
    
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ Created .env file for local testing');
    console.log('   You can now run: node test-gcp-credentials.js');
    
  } catch (error) {
    console.error('❌ Error processing key file:', error.message);
    
    if (error.message.includes('Unexpected token')) {
      console.error('\n💡 The key file appears to be invalid JSON.');
      console.error('   Please make sure you downloaded the correct JSON file from GCP Console.');
    }
  }
}

// Run the formatter
if (require.main === module) {
  formatCredentialsForRailway();
}

module.exports = { formatCredentialsForRailway };