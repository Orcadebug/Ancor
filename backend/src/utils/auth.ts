import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload, AuthTokens } from '@/models/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 characters long');
}

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT token management
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ai-infra-platform',
    audience: 'ai-infra-platform-users'
  });

  const refreshToken = jwt.sign(
    { user_id: payload.user_id, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: '7d',
      issuer: 'ai-infra-platform',
      audience: 'ai-infra-platform-users'
    }
  );

  // Extract expiration time
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp - decoded.iat;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn
  };
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-infra-platform',
      audience: 'ai-infra-platform-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { user_id: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-infra-platform',
      audience: 'ai-infra-platform-users'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return { user_id: decoded.user_id };
  } catch (error) {
    return null;
  }
};

// API Key encryption (for storing cloud provider keys)
export const encryptApiKey = (apiKey: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptApiKey = (encryptedKey: string): string => {
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedData = parts.join(':');
  
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate secure random strings
export const generateSecureRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};