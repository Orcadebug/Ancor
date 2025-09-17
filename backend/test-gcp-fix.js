#!/usr/bin/env node
/**
 * Test GCP Fix - Verify the temporary file approach works
 */

require('dotenv').config();

async function testGCPFix() {
  console.log('🧪 Testing GCP Fix with Temporary File Approach\n');
  
  // Check environment variables
  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GCP_KEY_FILE_BASE64;
  
  if (!projectId || !keyFile) {
    console.log('❌ Missing GCP_PROJECT_ID or GCP_KEY_FILE_BASE64');
    console.log('   Set these environment variables to test the fix');
    return false;
  }
  
  try {
    console.log('📋 Environment Variables:');
    console.log(`   GCP_PROJECT_ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GCP_KEY_FILE_BASE64: ${keyFile ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    // Test the RealGCPDeployment class
    console.log('🔧 Testing RealGCPDeployment...');
    const RealGCPDeployment = require('./real-gcp-deployment');
    const realGCP = new RealGCPDeployment();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (realGCP.isReady) {
      console.log('✅ RealGCPDeployment initialized successfully');
    } else {
      console.log('❌ RealGCPDeployment failed to initialize');
      if (realGCP.initializationError) {
        console.log(`   Error: ${realGCP.initializationError.message}`);
      }
    }
    
    // Test the GCPService class
    console.log('\n🔧 Testing GCPService...');
    const GCPService = require('./gcp-integration');
    const gcpService = new GCPService();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (gcpService.isMockMode) {
      console.log('❌ GCPService is in mock mode');
    } else {
      console.log('✅ GCPService initialized successfully');
    }
    
    console.log('\n🎉 GCP Fix Test Complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy to Railway: railway up');
    console.log('2. Test the endpoint: curl https://your-domain/api/test-gcp');
    console.log('3. Check logs for successful GCP authentication');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ GCP Fix test failed:');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testGCPFix().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testGCPFix;