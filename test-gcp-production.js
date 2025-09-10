/**
 * Production GCP Integration Test
 * Tests all production features and configurations
 */

require('dotenv').config({ path: './backend/.env' });
const GCPService = require('./backend/gcp-integration');

async function testProductionGCP() {
  console.log('🏭 Testing GCP Production Integration...\n');
  
  try {
    // Initialize GCP service
    const gcpService = new GCPService();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📋 Production Configuration Status:');
    console.log(`   Project ID: ${process.env.GCP_PROJECT_ID || 'Not set'}`);
    console.log(`   Region: ${process.env.GCP_REGION || 'us-central1 (default)'}`);
    console.log(`   Service Account: ${process.env.GCP_SERVICE_ACCOUNT_EMAIL || 'Not set'}`);
    console.log(`   Key File: ${process.env.GCP_KEY_FILE || 'Not set'}`);
    console.log(`   Mode: ${gcpService.isMockMode ? '🎭 Mock' : '🏭 Production'}\n`);
    
    // Test health check
    console.log('🏥 Testing health check...');
    const healthCheck = await gcpService.healthCheck();
    console.log('✅ Health check result:', healthCheck);
    console.log('');
    
    // Test production deployment creation
    console.log('🚀 Testing production deployment creation...');
    const deploymentConfig = {
      deploymentId: `prod-test-${Date.now()}`,
      name: 'Production Test Deployment',
      industry: 'legal',
      model: 'llama-3-8b'
    };
    
    const deploymentResult = await gcpService.createDeployment(deploymentConfig);
    console.log('✅ Production deployment created:', {
      deploymentId: deploymentResult.deploymentId,
      status: deploymentResult.status,
      apiUrl: deploymentResult.apiUrl,
      provider: deploymentResult.provider,
      region: deploymentResult.region,
      monitoring: deploymentResult.monitoring
    });
    console.log('');
    
    // Test status monitoring
    console.log('📊 Testing deployment status monitoring...');
    const statusResult = await gcpService.getDeploymentStatus(deploymentConfig.deploymentId);
    console.log('✅ Status monitoring result:', statusResult);
    console.log('');
    
    // Test document upload with production features
    console.log('📄 Testing production document upload...');
    const mockFile = {
      originalname: 'production-test-document.pdf',
      buffer: Buffer.from('Production test PDF content with metadata'),
      size: 2048,
      mimetype: 'application/pdf'
    };
    
    const uploadResult = await gcpService.uploadDocument(deploymentConfig.deploymentId, mockFile);
    console.log('✅ Production document upload result:', {
      fileName: uploadResult.fileName,
      size: uploadResult.size,
      contentType: uploadResult.contentType,
      bucket: uploadResult.bucket,
      uploadedAt: uploadResult.uploadedAt,
      hasSignedUrl: !!uploadResult.url
    });
    console.log('');
    
    // Test deployment cleanup
    console.log('🧹 Testing production deployment cleanup...');
    const cleanupResult = await gcpService.stopDeployment(deploymentConfig.deploymentId);
    console.log('✅ Production cleanup result:', cleanupResult);
    console.log('');
    
    // Production readiness assessment
    console.log('🎯 Production Readiness Assessment:');
    
    const readinessChecks = {
      'GCP Project Configured': !!process.env.GCP_PROJECT_ID && !process.env.GCP_PROJECT_ID.includes('your-'),
      'Service Account Set': !!process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      'Authentication Working': healthCheck.status === 'healthy',
      'Production Mode': !gcpService.isMockMode,
      'Monitoring Available': !!deploymentResult.monitoring,
      'Security Configured': !!deploymentResult.serviceAccount,
      'Storage Working': uploadResult.bucket && !uploadResult.bucket.includes('mock')
    };
    
    Object.entries(readinessChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    const passedChecks = Object.values(readinessChecks).filter(Boolean).length;
    const totalChecks = Object.keys(readinessChecks).length;
    
    console.log(`\n📈 Production Readiness Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 Your GCP integration is PRODUCTION READY!');
    } else if (passedChecks >= totalChecks * 0.7) {
      console.log('⚠️ Your GCP integration is mostly ready - address remaining items');
    } else {
      console.log('🔧 Your GCP integration needs more configuration for production');
    }
    
    // Production recommendations
    console.log('\n💡 Production Recommendations:');
    
    if (gcpService.isMockMode) {
      console.log('   1. Configure real GCP credentials for production deployments');
      console.log('   2. Set up proper service account with minimal permissions');
      console.log('   3. Enable required GCP APIs in your project');
    } else {
      console.log('   1. Set up monitoring and alerting policies');
      console.log('   2. Configure budget alerts to control costs');
      console.log('   3. Implement backup and disaster recovery procedures');
      console.log('   4. Set up VPC networking for enhanced security');
      console.log('   5. Configure KMS encryption for sensitive data');
    }
    
    console.log('   6. Review and test auto-scaling policies');
    console.log('   7. Set up log aggregation and analysis');
    console.log('   8. Implement health checks and uptime monitoring');
    console.log('   9. Configure CI/CD pipelines for automated deployments');
    console.log('   10. Document incident response procedures');
    
    console.log('\n📚 Next Steps:');
    console.log('   • Review GCP_PRODUCTION_DEPLOYMENT_GUIDE.md for detailed setup');
    console.log('   • Test with real AI workloads in a staging environment');
    console.log('   • Set up monitoring dashboards in GCP Console');
    console.log('   • Configure automated backups and disaster recovery');
    
  } catch (error) {
    console.error('❌ Production GCP integration test failed:', error);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   1. Verify GCP_PROJECT_ID is set correctly');
    console.log('   2. Check service account key file exists and is valid');
    console.log('   3. Ensure required GCP APIs are enabled');
    console.log('   4. Verify service account has necessary permissions');
    console.log('   5. Check network connectivity to GCP services');
  }
}

// Run the production test
testProductionGCP();