#!/usr/bin/env node
/**
 * Debug Environment Variables
 * This script helps debug what environment variables are available
 */

console.log('🔍 Environment Variables Debug\n');

console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('GCP_SERVICE_ACCOUNT_EMAIL:', process.env.GCP_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('GCP_KEY_FILE_BASE64:', process.env.GCP_KEY_FILE_BASE64 ? '✅ Set' : '❌ Missing');
console.log('GCP_REGION:', process.env.GCP_REGION || 'us-central1');

if (process.env.GCP_KEY_FILE_BASE64) {
  try {
    const decodedJson = Buffer.from(process.env.GCP_KEY_FILE_BASE64, 'base64').toString('utf8');
    const keyData = JSON.parse(decodedJson);
    console.log('\n📋 GCP Key File Details:');
    console.log('  Project ID:', keyData.project_id);
    console.log('  Client Email:', keyData.client_email);
    console.log('  Type:', keyData.type);
    console.log('  Has Private Key:', keyData.private_key ? '✅ Yes' : '❌ No');
  } catch (error) {
    console.log('\n❌ GCP_KEY_FILE is not valid JSON:', error.message);
  }
}

console.log('\n🔧 All Environment Variables:');
Object.keys(process.env)
  .filter(key => key.includes('GCP') || key.includes('RAILWAY'))
  .forEach(key => {
    const value = process.env[key];
    if (key.includes('KEY_FILE')) {
      console.log(`${key}: ${value ? 'Set (' + value.length + ' chars)' : 'Missing'}`);
    } else {
      console.log(`${key}: ${value || 'Missing'}`);
    }
  });