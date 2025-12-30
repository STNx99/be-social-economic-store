import { z } from 'zod';


export const IDSchema = z.string().uuid('Invalid ID format');
export const OptionalIDSchema = IDSchema.optional();


export const RequiredStringSchema = z.string().min(1, 'This field is required');


export const EmailSchema = z
  .email('Invalid email format')
  .refine(
    (email) => {
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
      return !disposableDomains.includes(domain);
    },
    'Disposable email addresses are not allowed'
  );


export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');


export const NameSchema = z.string()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must be less than 100 characters long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .refine(
    (name) => name.trim() === name,
    'Name cannot have leading or trailing whitespace'
  );


export const UserRoleSchema = z.enum(['admin', 'customer', 'seller']).default('customer');


export const UUIDSchema = z.string().uuid('Invalid UUID format');


export const URLSchema = z.string().url('Invalid URL format');


export const PositiveNumberSchema = z.number().positive('Must be a positive number');


export const NonEmptyStringSchema = z.string().min(1, 'This field is required');


export const OptionalStringSchema = z.string().optional();


export const DateSchema = z.date();


export const FutureDateSchema = z.date().refine(
  (date) => date > new Date(),
  'Date must be in the future'
);


export const PastDateSchema = z.date().refine(
  (date) => date < new Date(),
  'Date must be in the past'
);


export type ID = z.infer<typeof IDSchema>;
export type OptionalID = z.infer<typeof OptionalIDSchema>;
export type RequiredString = z.infer<typeof RequiredStringSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type Name = z.infer<typeof NameSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UUID = z.infer<typeof UUIDSchema>;