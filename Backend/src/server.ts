import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from '@/routes/auth.js';
import deploymentRoutes from '@/routes/deployments.js';

// Import utilities
import { logger } from '@/utils/logger.js';
import { testDatabaseConnection, disconnectDatabase } from '@/config/database.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/deployments', deploymentRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join deployment room for real-time updates
  socket.on('join-deployment', (deploymentId: string) => {
    socket.join(`deployment-${deploymentId}`);
    logger.info(`Client ${socket.id} joined deployment room: ${deploymentId}`);
  });

  // Leave deployment room
  socket.on('leave-deployment', (deploymentId: string) => {
    socket.leave(`deployment-${deploymentId}`);
    logger.info(`Client ${socket.id} left deployment room: ${deploymentId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP server
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    // Disconnect from database
    await disconnectDatabase();
    
    // Exit process
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Seed initial data if needed
    await seedInitialData();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Seed initial data
async function seedInitialData() {
  try {
    const { prisma } = await import('@/config/database.js');
    
    // Check if AI models exist
    const modelCount = await prisma.aIModel.count();
    
    if (modelCount === 0) {
      logger.info('Seeding initial AI models...');
      
      await prisma.aIModel.createMany({
        data: [
          {
            name: 'LLaMA 3 8B',
            type: 'LIGHTWEIGHT',
            parameters: '8B',
            vramRequirement: 16,
            tokensPerDay: 1000000,
            monthlyPrice: 30000, // $300.00 in cents
            description: 'Perfect for basic document analysis and small teams',
            specifications: '8 billion parameters • 4-16GB VRAM • Up to 1M tokens/day',
            isRecommended: false
          },
          {
            name: 'LLaMA 3 70B',
            type: 'RECOMMENDED',
            parameters: '70B',
            vramRequirement: 80,
            tokensPerDay: 10000000,
            monthlyPrice: 120000, // $1,200.00 in cents
            description: 'Ideal balance of performance and cost for most organizations',
            specifications: '70 billion parameters • 40-80GB VRAM • Up to 10M tokens/day',
            isRecommended: true
          },
          {
            name: 'LLaMA 3 405B',
            type: 'ENTERPRISE',
            parameters: '405B',
            vramRequirement: 200,
            tokensPerDay: 100000000,
            monthlyPrice: 300000, // $3,000.00 in cents
            description: 'Maximum performance for large-scale enterprise deployments',
            specifications: '405 billion parameters • 200GB+ VRAM • Up to 100M tokens/day',
            isRecommended: false
          }
        ]
      });
      
      logger.info('AI models seeded successfully');
    }
    
  } catch (error) {
    logger.error('Failed to seed initial data:', error);
  }
}

// Export for testing
export { app, io };

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}