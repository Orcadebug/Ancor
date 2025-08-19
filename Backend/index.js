const express = require('express');
const cors = require('cors');

console.log('🔄 Starting server...');
console.log('📦 Loading environment variables...');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚪 Port: ${PORT}`);

// Basic middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('💚 Health check requested');
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.status(200).json({
    success: true,
    message: 'AI Infrastructure Platform API',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/api/test'
    }
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint requested');
  res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log('🚀 Starting HTTP server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server successfully started!`);
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/api/test`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('💥 Server failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;