#!/usr/bin/env node
/**
 * Validate GCP Credentials - Debug Token Refresh Issues
 * This script helps diagnose "Could not refresh access token" errors
 */

require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

async function validateCredentials() {
  console.log('🔍 GCP Credentials Validation Tool\n');
  
  const keyFile = process.env.GCP_KEY_FILE_BASE64;
  const projectId = process.env.GCP_PROJECT_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  
  console.log('📋 Environment Variables:');
  console.log(`   GCP_PROJECT_ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GCP_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GCP_KEY_FILE_BASE64: ${keyFile ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (!keyFile || !projectId) {
    console.error('❌ Missing required environment variables');
    return false;
  }
  
  try {
    // Decode and validate credentials
    console.log('🔐 Decoding and validating credentials...');
    const decodedJson = Buffer.from(keyFile, 'base64').toString('utf8');
    const credentials = JSON.parse(decodedJson);
    
    console.log('✅ Base64 decoding successful');
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Client Email: ${credentials.client_email}`);
    console.log(`   Type: ${credentials.type}`);
    console.log(`   Private Key ID: ${credentials.private_key_id}`);
    
    // Validate required fields
    const requiredFields = ['private_key', 'client_email', 'project_id', 'type', 'private_key_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate private key format
    if (!credentials.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Invalid private key format - not a valid PEM key');
      return false;
    }
    
    console.log('✅ All required fields present and valid');
    
    // Test authentication
    console.log('\n🔑 Testing authentication...');
    const auth = new GoogleAuth({
      projectId: projectId,
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.admin',
        'https://www.googleapis.com/auth/devstorage.full_control'
      ]
    });
    
    const authClient = await auth.getClient();
    console.log('✅ Auth client created successfully');
    
    // Test token refresh
    console.log('🔄 Testing token refresh...');
    const accessToken = await authClient.getAccessToken();
    
    if (accessToken && accessToken.token) {
      console.log('✅ Access token obtained successfully');
      console.log(`   Token type: ${accessToken.token_type || 'Bearer'}`);
      console.log(`   Expires in: ${accessToken.expires_in || 'unknown'} seconds`);
      console.log(`   Token preview: ${accessToken.token.substring(0, 20)}...`);
    } else {
      console.error('❌ Access token response missing token field');
      console.log('   Response:', accessToken);
      return false;
    }
    
    console.log('\n🎉 All credential validation tests passed!');
    console.log('\n📝 Your credentials are valid and ready for Railway deployment.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Credential validation failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Could not refresh access token')) {
      console.error('\n💡 Token refresh error usually indicates:');
      console.error('   - Invalid or corrupted service account key');
      console.error('   - Missing required fields in credentials');
      console.error('   - Clock skew or network issues');
      console.error('   - Service account permissions');
      console.error('   - Base64 encoding/decoding issues');
    } else if (error.message.includes('Invalid base64')) {
      console.error('\n💡 Base64 decoding error:');
      console.error('   - Check if GCP_KEY_FILE_BASE64 is properly encoded');
      console.error('   - Try re-encoding your service account key');
    } else if (error.message.includes('Unexpected token')) {
      console.error('\n💡 JSON parsing error:');
      console.error('   - The decoded base64 is not valid JSON');
      console.error('   - Check if the original key file was valid');
    }
    
    return false;
  }
}

// Run the validation
if (require.main === module) {
  validateCredentials().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = validateCredentials;