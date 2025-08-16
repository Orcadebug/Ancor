import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { query, transaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  companyName: Joi.string().max(255).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register new user
router.post('/register', strictRateLimiter, asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email, password, firstName, lastName, companyName } = value;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw createError('User already exists with this email', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user and organization in transaction
  const result = await transaction(async (txQuery) => {
    // Create user
    const userResult = await txQuery(`
      INSERT INTO users (email, password_hash, first_name, last_name, company_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, company_name, created_at
    `, [email, passwordHash, firstName, lastName, companyName]);

    const user = userResult.rows[0];

    // Create default organization if company name provided
    if (companyName) {
      const orgResult = await txQuery(`
        INSERT INTO organizations (name, owner_id, billing_email)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [companyName, user.id, email]);

      const organizationId = orgResult.rows[0].id;

      // Add user as organization owner
      await txQuery(`
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ($1, $2, 'owner')
      `, [organizationId, user.id]);

      user.organizationId = organizationId;
    }

    return user;
  });

  logger.info('User registered', { userId: result.id, email: result.email });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: result.id,
      email: result.email,
      firstName: result.first_name,
      lastName: result.last_name,
      companyName: result.company_name,
      organizationId: result.organizationId
    }
  });
}));

// Login user
router.post('/login', strictRateLimiter, asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Get user with password
  const userResult = await query(`
    SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.email_verified,
           o.id as organization_id, o.name as organization_name
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id AND om.role = 'owner'
    LEFT JOIN organizations o ON o.id = om.organization_id
    WHERE u.email = $1
  `, [email]);

  if (userResult.rows.length === 0) {
    throw createError('Invalid email or password', 401);
  }

  const user = userResult.rows[0];

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  if (!user.email_verified) {
    throw createError('Please verify your email before logging in', 401);
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info('User logged in', { userId: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name
    }
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userResult = await query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.company_name,
           o.id as organization_id, o.name as organization_name
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id AND om.role = 'owner'
    LEFT JOIN organizations o ON o.id = om.organization_id
    WHERE u.id = $1
  `, [req.user!.id]);

  const user = userResult.rows[0];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyName: user.company_name,
      organizationId: user.organization_id,
      organizationName: user.organization_name
    }
  });
}));

// Update user profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const updateSchema = Joi.object({
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    companyName: Joi.string().max(255).optional()
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const updateFields = [];
  const updateValues = [];
  let paramCounter = 1;

  Object.entries(value).forEach(([key, val]) => {
    if (val !== undefined) {
      updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCounter}`);
      updateValues.push(val);
      paramCounter++;
    }
  });

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateValues.push(req.user!.id);

  const result = await query(`
    UPDATE users 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCounter}
    RETURNING id, email, first_name, last_name, company_name
  `, updateValues);

  const user = result.rows[0];

  logger.info('User profile updated', { userId: req.user!.id });

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name
    }
  });
}));

export default router;