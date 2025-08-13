import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createAppError } from '@/middleware/errorHandler';
import { validatePassword } from '@/utils/auth';

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw createAppError(`Validation error: ${errors.join(', ')}`, 400);
    }

    next();
  };
};

// Custom password validator
const passwordValidator = (value: string, helpers: any) => {
  const validation = validatePassword(value);
  if (!validation.isValid) {
    return helpers.error('password.invalid', { errors: validation.errors });
  }
  return value;
};

// Register custom Joi messages
const customMessages = {
  'password.invalid': 'Password requirements not met: {#errors}'
};

// Auth validation schemas
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .custom(passwordValidator)
    .required()
    .messages(customMessages),
  
  first_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must be less than 100 characters',
      'any.required': 'First name is required'
    }),
  
  last_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must be less than 100 characters',
      'any.required': 'Last name is required'
    }),
  
  company: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Company name must be less than 255 characters'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string()
    .min(1)
    .max(100)
    .optional(),
  
  last_name: Joi.string()
    .min(1)
    .max(100)
    .optional(),
  
  company: Joi.string()
    .max(255)
    .optional()
    .allow('')
});

// Deployment validation schemas
const createDeploymentSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'any.required': 'Deployment name is required',
      'string.min': 'Deployment name cannot be empty'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .allow(''),
  
  ai_model_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'AI model selection is required',
      'string.guid': 'Invalid AI model ID'
    }),
  
  model_config: Joi.object({
    temperature: Joi.number().min(0).max(2).optional(),
    max_tokens: Joi.number().min(1).max(100000).optional(),
    top_p: Joi.number().min(0).max(1).optional(),
    frequency_penalty: Joi.number().min(-2).max(2).optional(),
    presence_penalty: Joi.number().min(-2).max(2).optional(),
    custom_parameters: Joi.object().optional()
  }).required(),
  
  cloud_provider_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Cloud provider selection is required'
    }),
  
  region: Joi.string()
    .required()
    .messages({
      'any.required': 'Region selection is required'
    }),
  
  instance_type: Joi.string()
    .required()
    .messages({
      'any.required': 'Instance type selection is required'
    }),
  
  rate_limit: Joi.number()
    .min(1)
    .max(10000)
    .default(100),
  
  security_config: Joi.object({
    ip_allowlist: Joi.array().items(Joi.string().ip()).optional(),
    require_api_key: Joi.boolean().default(true),
    cors_origins: Joi.array().items(Joi.string().uri()).optional(),
    rate_limit_per_ip: Joi.number().min(1).max(1000).optional()
  }).required()
});

const updateDeploymentSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  model_config: Joi.object({
    temperature: Joi.number().min(0).max(2).optional(),
    max_tokens: Joi.number().min(1).max(100000).optional(),
    top_p: Joi.number().min(0).max(1).optional(),
    frequency_penalty: Joi.number().min(-2).max(2).optional(),
    presence_penalty: Joi.number().min(-2).max(2).optional(),
    custom_parameters: Joi.object().optional()
  }).optional(),
  rate_limit: Joi.number().min(1).max(10000).optional(),
  security_config: Joi.object({
    ip_allowlist: Joi.array().items(Joi.string().ip()).optional(),
    require_api_key: Joi.boolean().optional(),
    cors_origins: Joi.array().items(Joi.string().uri()).optional(),
    rate_limit_per_ip: Joi.number().min(1).max(1000).optional()
  }).optional()
});

// Alert validation schema
const createAlertSchema = Joi.object({
  deployment_id: Joi.string().uuid().optional(),
  alert_type: Joi.string()
    .valid('performance', 'cost', 'security', 'maintenance')
    .required(),
  name: Joi.string().min(1).max(255).required(),
  condition_config: Joi.object({
    metric: Joi.string().required(),
    operator: Joi.string().valid('>', '<', '>=', '<=', '==', '!=').required(),
    threshold: Joi.number().required(),
    duration_minutes: Joi.number().min(1).max(1440).optional()
  }).required(),
  notification_channels: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('email', 'slack', 'webhook').required(),
      config: Joi.object().required()
    })
  ).min(1).required()
});

// Export validation middleware
export const validateAuth = {
  register: validate(registerSchema),
  login: validate(loginSchema),
  updateProfile: validate(updateProfileSchema)
};

export const validateDeployment = {
  create: validate(createDeploymentSchema),
  update: validate(updateDeploymentSchema)
};

export const validateAlert = {
  create: validate(createAlertSchema)
};