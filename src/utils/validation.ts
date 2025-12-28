import { z } from 'zod';
import { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { SanitizedUserInputSchema, UserIdParamSchema } from '@/utils/schemas';

// Email validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isDisposableEmail = (email: string): boolean => {
  const disposableDomains = [
    '10minutemail.com',
    'temp-mail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'yopmail.com',
    'tempail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableDomains.includes(domain) : false;
};

// Password validation utilities
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

export const passwordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 8) return 'medium';
  if (isStrongPassword(password)) return 'strong';
  return 'medium';
};

// String validation utilities
export const isValidLength = (str: string, min: number, max?: number): boolean => {
  if (max !== undefined) {
    return str.length >= min && str.length <= max;
  }
  return str.length >= min;
};

export const containsOnlyLetters = (str: string): boolean => {
  return /^[a-zA-Z\s]+$/.test(str);
};

export const containsOnlyLettersAndNumbers = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

export const containsOnlyLettersNumbersAndSpaces = (str: string): boolean => {
  return /^[a-zA-Z0-9\s]+$/.test(str);
};

export const isValidName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s'-]+$/.test(name) && name.trim() === name;
};

// Number validation utilities
export const isValidInteger = (value: unknown): boolean => {
  return Number.isInteger(Number(value));
};

export const isValidPositiveNumber = (value: unknown): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const isValidRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// UUID validation utilities
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidUUIDv4 = (uuid: string): boolean => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
};

// Date validation utilities
export const isValidDate = (date: unknown): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isValidDate(date);
};

export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};

export const isPastDate = (date: Date): boolean => {
  return date < new Date();
};

// Phone number validation utilities
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// URL validation utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidHttpUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// General validation utilities
export const isNotEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
};

export const isEmpty = (value: unknown): boolean => {
  return !isNotEmpty(value);
};

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation function type
export type ValidationFunction<T = unknown> = (value: T) => ValidationResult;

// Common validation functions
export const validateRequired = (value: unknown, fieldName: string): ValidationResult => {
  if (isEmpty(value)) {
    return { isValid: false, errors: [`${fieldName} is required`] };
  }
  return { isValid: true, errors: [] };
};

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }
  
  if (isDisposableEmail(email)) {
    errors.push('Disposable email addresses are not allowed');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!isValidName(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }
  
  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (name.length > 100) {
    errors.push('Name must be less than 100 characters long');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateUUID = (uuid: string): ValidationResult => {
  if (!isValidUUID(uuid)) {
    return { isValid: false, errors: ['Invalid UUID format'] };
  }
  return { isValid: true, errors: [] };
};

// Chain validation utility
export const chainValidations = (...validations: ValidationResult[]): ValidationResult => {
  const allErrors = validations.flatMap(v => v.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Zod integration utilities
export const createZodValidationResult = (result: ReturnType<z.ZodSchema<unknown>['safeParse']>): ValidationResult => {
  if (result.success) {
    return { isValid: true, errors: [] };
  }

  const errors = result.error.issues.map((issue: z.ZodIssue) =>
    `${issue.path.join('.')}: ${issue.message}`
  );

  return { isValid: false, errors };
};

// Zod integration utilities
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((err: z.ZodIssue) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Hono middleware functions
// Hono middleware function
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  errorStatus: ContentfulStatusCode = 400
) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();

      const result = schema.safeParse(body);

      if (!result.success) {
        const errors = result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return c.json({
          success: false,
          error: 'Validation failed',
          details: errors
        }, errorStatus);
      }

      c.set('validatedBody', result.data);
      await next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({
          success: false,
          error: 'Invalid JSON in request body'
        }, 400);
      }

      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500);
    }
  };
}

export function validateUserCreation() {
  return validateWithZod(SanitizedUserInputSchema);
}

export function validateUserId() {
  return async (c: Context, next: Next) => {
    const id = c.req.param('id');

    const result = UserIdParamSchema.safeParse({ id });

    if (!result.success) {
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return c.json({
        success: false,
        error: 'Invalid user ID',
        details: errors
      }, 400);
    }

    c.set('validatedParams', result.data);
    await next();
  };
}

// Export common validation schemas for reuse
export const commonSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  uuid: z.string().uuid('Invalid UUID format'),
  url: z.string().url('Invalid URL format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'This field is required')
};