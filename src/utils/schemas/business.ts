import { z } from 'zod';
import { NonEmptyStringSchema, URLSchema } from '@/utils/schemas/common';

export const AddressSchema = z.object({
  street: NonEmptyStringSchema,
  city: NonEmptyStringSchema,
  state: NonEmptyStringSchema,
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: NonEmptyStringSchema
});

export const PhoneNumberSchema = z.string().refine(
  (phone) => /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''),
));

export const SocialMediaSchema = z.object({
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube']),
  url: URLSchema,
  username: z.string().optional()
});

export type Address = z.infer<typeof AddressSchema>;
export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;
export type SocialMedia = z.infer<typeof SocialMediaSchema>;
