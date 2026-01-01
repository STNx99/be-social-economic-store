import { z } from 'zod';
import { IDSchema, URLSchema, NonEmptyStringSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

/**
 * Review entity schema with validation rules
 */
export const ReviewSchema = z.object({
  ...BaseEntityFields,
  productId: IDSchema,
  userId: IDSchema,
  userName: NonEmptyStringSchema,
  orderId: IDSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters'),
  images: z.array(URLSchema).default([]),
  verifiedPurchase: z.boolean().default(false),
  helpfulCount: z.number().int().min(0).default(0),
}).refine(...entityDateRefinement);

/**
 * Schema for validating review creation input (CreateReviewRequest)
 */
export const CreateReviewSchema = z.object({
  orderId: IDSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment must be less than 1000 characters'),
  images: z.array(URLSchema).optional().default([]),
});

/**
 * Schema for validating review update input (UpdateReviewRequest)
 */
export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
}).refine(...atLeastOneFieldRefinement);

/**
 * Schema for review summary statistics
 */
export const ReviewSummarySchema = z.object({
  averageRating: z.number().min(0).max(5),
  totalReviews: z.number().int().min(0),
  ratingDistribution: z.object({
    5: z.number().int().min(0),
    4: z.number().int().min(0),
    3: z.number().int().min(0),
    2: z.number().int().min(0),
    1: z.number().int().min(0),
  }),
});

/**
 * Schema for validating review ID parameters
 */
export const ReviewIdParamSchema = createIdParamSchema();

export type Review = z.infer<typeof ReviewSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;
export type ReviewIdParams = z.infer<typeof ReviewIdParamSchema>;