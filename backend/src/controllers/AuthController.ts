import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { hashPassword, verifyPassword, generateTokens, verifyRefreshToken } from '@/utils/auth';
import { createAppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { ApiResponse, User } from '@/models/types';

export class AuthController {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, first_name, last_name, company } = req.body;

      // Check if user already exists
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        throw createAppError('User with this email already exists', 409);
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create user
      const userData = {
        email: email.toLowerCase(),
        password_hash,
        first_name,
        last_name,
        company: company || null,
        role: 'user' as const,
        email_verified: false,
        is_active: true,
        last_login: null
      };

      const user = await this.db.createUser(userData);
      
      if (!user) {
        throw createAppError('Failed to create user account', 500);
      }

      // Generate tokens
      const tokens = generateTokens({
        user_id: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      await this.db.updateUser(user.id, { 
        last_login: new Date() 
      });

      // Log successful registration
      logger.info('User registered successfully', { 
        user_id: user.id, 
        email: user.email 
      });

      const response: ApiResponse = {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            company: user.company,
            role: user.role,
            email_verified: user.email_verified,
            created_at: user.created_at
          },
          tokens
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Get user by email
      const user = await this.db.getUserByEmail(email.toLowerCase());
      if (!user) {
        throw createAppError('Invalid email or password', 401);
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw createAppError('Invalid email or password', 401);
      }

      // Generate tokens
      const tokens = generateTokens({
        user_id: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      await this.db.updateUser(user.id, { 
        last_login: new Date() 
      });

      // Log successful login
      logger.info('User logged in successfully', { 
        user_id: user.id, 
        email: user.email 
      });

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            company: user.company,
            role: user.role,
            email_verified: user.email_verified,
            last_login: new Date(),
            created_at: user.created_at
          },
          tokens
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw createAppError('Refresh token is required', 400);
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refresh_token);
      if (!decoded) {
        throw createAppError('Invalid refresh token', 401);
      }

      // Get user
      const user = await this.db.getUserById(decoded.user_id);
      if (!user) {
        throw createAppError('User not found', 401);
      }

      // Generate new tokens
      const tokens = generateTokens({
        user_id: user.id,
        email: user.email,
        role: user.role
      });

      const response: ApiResponse = {
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            company: user.company,
            role: user.role,
            email_verified: user.email_verified,
            created_at: user.created_at,
            last_login: user.last_login
          }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const updates = req.body;

      const updatedUser = await this.db.updateUser(userId, updates);
      
      if (!updatedUser) {
        throw createAppError('Failed to update profile', 500);
      }

      logger.info('User profile updated', { user_id: userId });

      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            company: updatedUser.company,
            role: updatedUser.role,
            email_verified: updatedUser.email_verified,
            updated_at: updatedUser.updated_at
          }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a more advanced implementation, you might want to:
      // 1. Blacklist the JWT token
      // 2. Clear refresh tokens from database
      // 3. Log the logout event
      
      const userId = req.userId!;
      
      logger.info('User logged out', { user_id: userId });

      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}