import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1 AND email_verified = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw createError('Invalid or expired token', 401);
    }

    req.user = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      role: userResult.rows[0].role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(createError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

export const requireOrganizationAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const organizationId = req.params.organizationId || req.body.organizationId;
    
    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Check if user has access to this organization
    const accessResult = await query(`
      SELECT om.role, o.name 
      FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.organization_id = $1 AND om.user_id = $2
    `, [organizationId, req.user.id]);

    if (accessResult.rows.length === 0) {
      throw createError('Access denied to this organization', 403);
    }

    req.user.organizationId = organizationId;
    req.user.role = accessResult.rows[0].role; // Override with org role

    next();
  } catch (error) {
    next(error);
  }
};