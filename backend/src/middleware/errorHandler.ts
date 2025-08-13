import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message, stack } = err;

  logger.error('Error occurred:', {
    error: message,
    stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: any = {
    success: false,
    message: statusCode === 500 && !isDevelopment 
      ? 'Internal Server Error' 
      : message,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (isDevelopment && stack) {
    response.stack = stack;
  }

  res.status(statusCode).json(response);
};

export const createAppError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};