import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/auth';
import { DatabaseService } from '@/services/DatabaseService';
import { createAppError } from '@/middleware/errorHandler';
import { JWTPayload, User } from '@/models/types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

const db = new DatabaseService();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createAppError('Access token required', 401);
    }

    const payload: JWTPayload | null = verifyToken(token);
    
    if (!payload) {
      throw createAppError('Invalid or expired token', 401);
    }

    // Get user from database to ensure they still exist and are active
    const user = await db.getUserById(payload.user_id);
    
    if (!user) {
      throw createAppError('User not found or inactive', 401);
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload: JWTPayload | null = verifyToken(token);
      
      if (payload) {
        const user = await db.getUserById(payload.user_id);
        if (user) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }

    next();
  } catch (error) {
    // Don't propagate errors for optional auth
    next();
  }
};

// Role-based authorization
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createAppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw createAppError('Insufficient permissions', 403);
    }

    next();
  };
};

// Check if user owns the resource (for resource-specific authorization)
export const requireResourceOwnership = (resourceUserIdField: string = 'user_id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createAppError('Authentication required', 401);
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      throw createAppError('Resource ownership cannot be determined', 400);
    }

    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      throw createAppError('Access denied to this resource', 403);
    }

    next();
  };
};