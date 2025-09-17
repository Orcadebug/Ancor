#!/usr/bin/env node
/**
 * Simple GCP Credentials Test
 * Just test authentication without making API calls
 */

require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

async function simpleGCPTest() {
  console.log('🧪 Simple GCP Credentials Test\n');
  
  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GCP_KEY_FILE;
  
  if (!projectId || !keyFile) {
    console.error('❌ Missing GCP_PROJECT_ID or GCP_KEY_FILE');
    return false;
  }
  
  try {
    // Parse credentials
    const credentials = JSON.parse(keyFile);
    console.log('✅ Credentials parsed successfully');
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Client Email: ${credentials.client_email}`);
    
    // Test authentication
    const auth = new GoogleAuth({
      projectId: projectId,
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    console.log('🔐 Testing authentication...');
    const authClient = await auth.getClient();
    console.log('✅ Authentication successful!');
    
    // Get access token
    const accessToken = await authClient.getAccessToken();
    console.log('✅ Access token obtained');
    console.log(`   Token type: ${accessToken.token_type}`);
    console.log(`   Expires in: ${accessToken.expires_in} seconds`);
    
    console.log('\n🎉 GCP credentials are working!');
    console.log('\n📝 Ready for Railway deployment with these variables:');
    console.log(`GCP_PROJECT_ID=${projectId}`);
    console.log(`GCP_SERVICE_ACCOUNT_EMAIL=${credentials.client_email}`);
    console.log(`GCP_KEY_FILE='${JSON.stringify(credentials)}'`);
    console.log('GCP_REGION=us-central1');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ GCP credentials test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 This usually means the service account key is invalid or expired');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('\n💡 This usually means the service account lacks required permissions');
    }
    
    return false;
  }
}

if (require.main === module) {
  simpleGCPTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { simpleGCPTest };