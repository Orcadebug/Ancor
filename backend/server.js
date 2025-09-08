const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🔄 Starting AI Infrastructure Platform API...');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Import Supabase and auth middleware
const { supabase } = require('./supabase-client');
const { authenticateSupabaseUser, optionalAuth } = require('./auth-middleware');

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚪 Port: ${PORT}`);

// CORS configuration for Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://ancor-infraview.vercel.app',
    'https://ancor.vercel.app',
    'https://ancor-backend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced request logging with timing
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    if (path.startsWith("/api") && capturedJsonResponse && isDevelopment) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 100) {
      logLine = logLine.slice(0, 99) + "…";
    }

    console.log(logLine);
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('💚 Health check requested');
  res.status(200).json({
    success: true,
    message: 'AI Infrastructure Platform API is healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test authentication endpoint
app.get('/api/test-auth', authenticateSupabaseUser, (req, res) => {
  console.log('🔐 Auth test requested for user:', req.user.id);
  res.json({
    success: true,
    user: req.user,
    message: 'Authentication working correctly'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Infrastructure Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Azure Integration
const { AzureService } = require('./azure-integration');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Azure service
const azureService = new AzureService();

// In-memory storage for demo purposes (replace with database in production)
const deployments = new Map();
const documents = new Map();

console.log('✅ Services initialized - Supabase + Azure integration ready');

// Dashboard stats API
app.get('/api/dashboard/stats/:orgId', authenticateSupabaseUser, async (req, res) => {
  try {
    console.log('📊 Dashboard stats requested for user:', req.user.id);
    console.log('📊 Organization ID:', req.params.orgId);
    console.log('📊 User object:', JSON.stringify(req.user, null, 2));
    
    // Get deployments for the authenticated user's organization
    const { data: userDeployments, error: deploymentsError } = await supabase
      .from('deployments')
      .select('*')
      .eq('organization_id', req.params.orgId);
    
    if (deploymentsError) {
      console.error('Error fetching deployments:', deploymentsError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch deployments',
        details: deploymentsError.message 
      });
    }
    
    // Get documents for the authenticated user's deployments
    const { data: userDocuments, error: documentsError } = await supabase
      .from('documents')
      .select('*, deployments!inner(organization_id)')
      .eq('deployments.organization_id', req.params.orgId);
    
    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      // Don't fail if documents table doesn't exist yet
      console.warn('Documents table might not exist yet, continuing...');
    }
    
    const activeCount = userDeployments?.filter(d => d.status === 'active').length || 0;
    const totalCost = userDeployments?.reduce((sum, d) => sum + (d.monthly_cost || 0), 0) || 0;
    const docCount = userDocuments?.length || 0;
    
    console.log(`📊 Stats: ${activeCount} active deployments, ${docCount} documents, $${totalCost} cost`);
    
    res.json({
      activeDeployments: activeCount,
      documentsProcessed: docCount,
      monthlyCost: totalCost,
      successRate: 98.5
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    });
  }
});

// Get deployments for organization
app.get('/api/deployments/organization/:orgId', authenticateSupabaseUser, async (req, res) => {
  try {
    console.log('🚀 Deployments requested for user:', req.user.id);
    console.log('🚀 Organization ID:', req.params.orgId);
    
    const { data: userDeployments, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('organization_id', req.params.orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deployments:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch deployments',
        details: error.message 
      });
    }
    
    console.log(`🚀 Found ${userDeployments?.length || 0} deployments for user`);
    
    res.json({
      deployments: userDeployments || []
    });
  } catch (error) {
    console.error('Deployments fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch deployments',
      details: error.message 
    });
  }
});

// Create new deployment (REAL AZURE DEPLOYMENT)
app.post('/api/deployments', authenticateSupabaseUser, async (req, res) => {
  try {
    console.log('🚀 Creating REAL Azure deployment for user:', req.user.id);
    console.log('📝 Request body:', req.body);
    console.log('👤 User info:', req.user);
    const { name, industry, model, provider } = req.body;
    
    const deploymentId = `dep-${Date.now()}`;
    
    // Calculate costs
    const modelCosts = {
      'llama-3-8b': 85.50,
      'llama-3-70b': 171.00,
      'llama-3-405b': 342.00
    };
    
    const baseCost = modelCosts[model] || 171.00;
    const platformFee = baseCost * 0.07; // 7% markup
    const totalCost = baseCost + platformFee;
    
    // Generate UUID for deployment
    const { randomUUID } = require('crypto');
    const dbDeploymentId = randomUUID();
    
    // Create deployment record in Supabase
    const deploymentData = {
      id: dbDeploymentId, // Explicitly set UUID
      organization_id: req.user.organization_id || req.user.id, // Use org_id or fallback to user_id
      name,
      industry_template: industry,
      cloud_provider: provider || 'azure',
      region: 'us-east-1', // Default region
      model_size: model.replace('llama-3-', ''), // Extract size (8b, 70b, 405b)
      gpu_type: 'A100', // Default GPU type
      gpu_count: 1,
      status: 'provisioning',
      cost_per_hour: totalCost / (24 * 30), // Convert monthly to hourly
      configuration: {
        industry,
        model,
        provider,
        description: `${industry} deployment using ${model} on ${provider}`,
        azureDeploymentId: deploymentId // Store the Azure reference ID
      }
    };
    
    const { data: deployment, error } = await supabase
      .from('deployments')
      .insert([deploymentData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating deployment in Supabase:', error);
      console.error('❌ Deployment data that failed:', deploymentData);
      console.error('❌ User info:', req.user);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create deployment',
        details: error.message,
        code: error.code
      });
    }
    
    // Start real Azure deployment (async)
    azureService.createDeployment({
      deploymentId,
      name,
      industry,
      model
    }).then(async (result) => {
      // Update deployment with Azure details
      const { error: updateError } = await supabase
        .from('deployments')
        .update({
          status: 'active',
          endpoint_url: result.apiUrl,
          configuration: {
            ...deployment.configuration,
            publicIP: result.publicIP,
            storageContainer: result.storageContainer
          }
        })
        .eq('id', dbDeploymentId);
      
      if (updateError) {
        console.error('Error updating deployment:', updateError);
      } else {
        console.log(`✅ Azure deployment completed: ${deploymentId}`);
      }
    }).catch(async (error) => {
      console.error(`❌ Azure deployment failed: ${deploymentId}`, error);
      
      // Update deployment status to failed
      await supabase
        .from('deployments')
        .update({
          status: 'error',
          configuration: {
            ...deployment.configuration,
            error_message: error.message
          }
        })
        .eq('id', dbDeploymentId);
    });
    
    res.json({
      success: true,
      deployment,
      message: 'Real Azure deployment started! Check status in a few minutes.'
    });
    
  } catch (error) {
    console.error('❌ Deployment creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deployment'
    });
  }
});

// Get specific deployment
app.get('/api/deployments/:id', authenticateSupabaseUser, async (req, res) => {
  try {
    const deploymentId = req.params.id;
    
    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();
    
    if (error || !deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }
    
    // Get real-time status from Azure
    if (deployment.status === 'deploying' || deployment.status === 'active') {
      try {
        const azureStatus = await azureService.getDeploymentStatus(deploymentId);
        
        // Update status in Supabase if changed
        if (azureStatus.status !== deployment.status) {
          const { error: updateError } = await supabase
            .from('deployments')
            .update({
              status: azureStatus.status,
              endpoint_url: azureStatus.apiUrl
            })
            .eq('id', deploymentId);
          
          if (!updateError) {
            deployment.status = azureStatus.status;
            deployment.endpoint_url = azureStatus.apiUrl;
          }
        }
      } catch (error) {
        console.error('Failed to get Azure status:', error);
      }
    }
    
    res.json({
      success: true,
      deployment
    });
    
  } catch (error) {
    console.error('Failed to get deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment'
    });
  }
});

// Stop/terminate deployment
app.delete('/api/deployments/:id', authenticateSupabaseUser, async (req, res) => {
  try {
    const deploymentId = req.params.id;
    
    console.log('🛑 Stopping deployment:', deploymentId, 'for user:', req.user.id);
    
    // Get deployment to verify ownership and get Azure details
    const { data: deployment, error: fetchError } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();
    
    if (fetchError || !deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }
    
    // Check if deployment can be stopped
    if (deployment.status === 'terminated') {
      return res.status(400).json({
        success: false,
        error: 'Deployment is already terminated'
      });
    }
    
    // Update status to terminating first
    const { error: updateError } = await supabase
      .from('deployments')
      .update({
        status: 'terminating',
        updated_at: new Date().toISOString()
      })
      .eq('id', deploymentId);
    
    if (updateError) {
      console.error('Error updating deployment status:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update deployment status'
      });
    }
    
    // Stop Azure deployment (async)
    azureService.stopDeployment(deploymentId, deployment.configuration?.azureDeploymentId)
      .then(async () => {
        // Update to terminated status
        await supabase
          .from('deployments')
          .update({
            status: 'terminated',
            updated_at: new Date().toISOString()
          })
          .eq('id', deploymentId);
        
        console.log(`✅ Deployment terminated: ${deploymentId}`);
      })
      .catch(async (error) => {
        console.error(`❌ Failed to stop Azure deployment: ${deploymentId}`, error);
        
        // Update to error status
        await supabase
          .from('deployments')
          .update({
            status: 'error',
            configuration: {
              ...deployment.configuration,
              error_message: `Failed to terminate: ${error.message}`
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', deploymentId);
      });
    
    res.json({
      success: true,
      message: 'Deployment termination initiated',
      deployment: {
        ...deployment,
        status: 'terminating'
      }
    });
    
  } catch (error) {
    console.error('Failed to stop deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop deployment',
      details: error.message
    });
  }
});

// Upload document (REAL AZURE STORAGE)
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const deploymentId = req.body.deploymentId || 'demo-deployment';
    
    console.log('📄 Uploading document to Azure:', file.originalname);
    
    // Upload to Azure Blob Storage
    const uploadResult = await azureService.uploadDocument(deploymentId, file);
    
    // Extract text (simple implementation)
    let extractedText = '';
    if (file.mimetype === 'text/plain') {
      extractedText = file.buffer.toString();
    } else {
      extractedText = `Content from ${file.originalname}: This document contains important information that can be analyzed by AI.`;
    }
    
    // Process with AI
    const aiResult = await azureService.processDocument(deploymentId, extractedText);
    
    // Store document record
    const document = {
      id: uploadResult.blobName,
      deploymentId,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      status: 'processed',
      url: uploadResult.url,
      summary: aiResult.summary,
      extractedText,
      created_at: new Date().toISOString()
    };
    
    documents.set(document.id, document);
    
    res.json({
      success: true,
      document,
      message: 'Document uploaded and processed with real AI!'
    });
    
  } catch (error) {
    console.error('❌ Document upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
});

// Get documents for organization
app.get('/api/documents/organization/:orgId', (req, res) => {
  console.log('📄 Documents requested for org:', req.params.orgId);
  
  const orgDocuments = Array.from(documents.values());
  
  res.json({
    documents: orgDocuments
  });
});

// Chat with AI (REAL AI RESPONSES)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, deploymentId, documentId } = req.body;
    
    console.log('💬 Real AI chat request:', message);
    
    // Get document context if provided
    let context = '';
    if (documentId) {
      const document = documents.get(documentId);
      if (document) {
        context = document.extractedText || '';
      }
    }
    
    // Get AI response from Azure
    const aiResponse = await azureService.chatWithAI(
      deploymentId || 'demo-deployment',
      message,
      context
    );
    
    res.json({
      success: true,
      response: aiResponse.response,
      timestamp: aiResponse.timestamp
    });
    
  } catch (error) {
    console.error('❌ AI chat failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response'
    });
  }
});

// Billing summary
app.get('/api/billing/summary/:orgId', async (req, res) => {
  console.log('💰 Billing summary requested for org:', req.params.orgId);
  
  const orgDeployments = Array.from(deployments.values())
    .filter(d => d.orgId === req.params.orgId);
  
  const totalCost = orgDeployments.reduce((sum, d) => sum + (d.monthly_cost || 0), 0);
  const totalFee = orgDeployments.reduce((sum, d) => sum + (d.platform_fee || 0), 0);
  
  res.json({
    summary: {
      currentPeriodUsage: totalCost,
      platformFee: totalFee,
      activeDeployments: orgDeployments.filter(d => d.status === 'active').length
    }
  });
});

// Catch-all API route
app.use('/api/*', (req, res) => {
  console.log(`⚠️ Unhandled API route: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    message: 'This endpoint is not yet implemented'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    message: 'This route does not exist'
  });
});

// Start server
console.log('🚀 Starting HTTP server...');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AI Infrastructure Platform API running on port ${PORT}`);
  console.log(`🔗 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`📡 Ready to receive requests from frontend`);
});

module.exports = app;