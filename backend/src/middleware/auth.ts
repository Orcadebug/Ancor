import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database.js';
import { extractTokenFromHeader, verifyAccessToken, hasPermission } from '@/utils/auth.js';
import { AuthenticatedRequest } from '@/types/index.js';
import { logger } from '@/utils/logger.js';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify and decode token
    const payload = verifyAccessToken(token);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { 
        id: payload.userId,
        isActive: true 
      },
      include: {
        organization: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if organization is active
    if (!user.organization.isActive) {
      res.status(401).json({
        success: false,
        error: 'Organization is inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(requiredRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!hasPermission(req.user.role, requiredRole)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${requiredRole}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user belongs to the organization
 */
export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const organizationId = req.params.organizationId || req.body.organizationId;
  
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (organizationId && req.user.organizationId !== organizationId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to this organization',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
}

/**
 * Middleware to log user actions for audit purposes
 */
export function auditLog(action: string, resourceType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const resourceId = req.params.id || req.body.id || null;
        
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            resourceType,
            resourceId,
            details: {
              path: req.path,
              method: req.method,
              body: req.body,
              params: req.params,
              query: req.query
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Audit log error:', error);
      // Don't fail the request if audit logging fails
      next();
    }
  };
}