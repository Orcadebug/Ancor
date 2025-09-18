#!/usr/bin/env node
/**
 * Simple Authentication Test - Test with minimal scopes
 */

require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

async function testSimpleAuth() {
  console.log('🔍 Simple GCP Authentication Test\n');
  
  const keyFile = process.env.GCP_KEY_FILE_BASE64;
  const projectId = process.env.GCP_PROJECT_ID;
  
  if (!keyFile || !projectId) {
    console.error('❌ Missing required environment variables');
    return false;
  }
  
  try {
    // Decode credentials
    const decodedJson = Buffer.from(keyFile, 'base64').toString('utf8');
    const credentials = JSON.parse(decodedJson);
    
    console.log('✅ Credentials decoded successfully');
    console.log(`   Service Account: ${credentials.client_email}`);
    console.log(`   Project ID: ${credentials.project_id}`);
    
    // Test with minimal scope first
    console.log('\n🔑 Testing with basic cloud-platform scope...');
    const auth = new GoogleAuth({
      projectId: projectId,
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    console.log('✅ Auth client created');
    
    // Try to get access token
    const accessToken = await authClient.getAccessToken();
    
    if (accessToken && accessToken.token) {
      console.log('✅ Access token obtained successfully!');
      console.log(`   Token type: ${accessToken.token_type || 'Bearer'}`);
      console.log(`   Expires in: ${accessToken.expires_in || 'unknown'} seconds`);
      console.log(`   Token preview: ${accessToken.token.substring(0, 30)}...`);
      
      // Test a simple API call
      console.log('\n📡 Testing simple API call...');
      try {
        const response = await authClient.request({
          url: `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`,
          method: 'GET'
        });
        
        if (response.status === 200) {
          console.log('✅ API call successful - service account has proper permissions');
          console.log(`   Project name: ${response.data.name || 'N/A'}`);
        } else {
          console.log(`⚠️ API call returned status ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError.message);
        if (apiError.message.includes('403')) {
          console.error('   This indicates missing IAM permissions');
        }
      }
      
      return true;
      
    } else {
      console.error('❌ Access token missing from response');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 Invalid grant error usually means:');
      console.error('   - Service account was deleted or disabled');
      console.error('   - Clock skew (server time is wrong)');
      console.error('   - Key file was corrupted');
    } else if (error.message.includes('invalid_client')) {
      console.error('\n💡 Invalid client error usually means:');
      console.error('   - Wrong client_email in the key');
      console.error('   - Service account doesn\'t exist');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testSimpleAuth().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testSimpleAuth;