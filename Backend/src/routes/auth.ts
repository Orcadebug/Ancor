import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database.js';
import { logger } from '@/utils/logger.js';
import { hashPassword, verifyPassword, generateTokenPair, verifyRefreshToken } from '@/utils/auth.js';
import { authenticate } from '@/middleware/auth.js';
import { AuthenticatedRequest, ApiResponse } from '@/types/index.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  organizationName: z.string().min(1).max(100),
  industry: z.enum(['LEGAL', 'HEALTHCARE', 'FINANCE', 'PROFESSIONAL']),
  teamSize: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  documentVolume: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

/**
 * Register new user and organization
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          industry: validatedData.industry,
          teamSize: validatedData.teamSize,
          documentVolume: validatedData.documentVolume
        }
      });

      // Create user as admin of the organization
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          passwordHash,
          organizationId: organization.id,
          role: 'ADMIN'
        }
      });

      return { user, organization };
    });

    // Generate tokens
    const tokens = generateTokenPair(result.user as any);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          organizationId: result.user.organizationId
        },
        organization: result.organization,
        tokens
      },
      message: 'Registration successful',
      timestamp: new Date().toISOString()
    };

    logger.info(`New user registered: ${result.user.email}`);
    res.status(201).json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user with organization
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { organization: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user and organization are active
    if (!user.isActive || !user.organization.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair(user as any);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId
        },
        organization: user.organization,
        tokens
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    };

    logger.info(`User logged in: ${user.email}`);
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = refreshSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyRefreshToken(validatedData.refreshToken);

    // Get user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { 
        id: payload.userId,
        isActive: true 
      },
      include: { organization: true }
    });

    if (!user || !user.organization.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(user as any);

    const response: ApiResponse = {
      success: true,
      data: { tokens },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.error('Token refresh failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get current user profile
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { 
        organization: true,
        _count: {
          select: {
            auditLogs: true,
            chatSessions: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        stats: {
          auditLogs: user._count.auditLogs,
          chatSessions: user._count.chatSessions
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Logout user (optional endpoint for audit logging)
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Log the logout event
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'logout',
        resourceType: 'auth',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    };

    logger.info(`User logged out: ${req.user!.email}`);
    res.json(response);

  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;