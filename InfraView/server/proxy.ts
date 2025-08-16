// Proxy middleware to forward requests to the main AI Platform backend
import type { Express } from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

const AI_PLATFORM_BACKEND = process.env.AI_PLATFORM_BACKEND_URL || 'http://localhost:3001';

export function setupProxy(app: Express) {
  // Proxy all /api requests to the AI Platform backend
  app.use('/api', createProxyMiddleware({
    target: AI_PLATFORM_BACKEND,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api', // Keep the /api prefix
    },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ 
        error: 'Backend service unavailable',
        message: 'Could not connect to AI Platform backend'
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward authentication headers
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    }
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      frontend: 'InfraView',
      backend: AI_PLATFORM_BACKEND,
      timestamp: new Date().toISOString()
    });
  });
}