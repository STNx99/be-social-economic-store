import { z } from 'zod';
import { IDSchema, DateSchema } from './common';

/**
 * Base fields for all entities in the system
 */
export const BaseEntityFields = {
  id: IDSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
};

/**
 * Common refinement for entities to ensure updatedAt is not before createdAt
 */
export const entityDateRefinement: [
  (data: { createdAt: Date; updatedAt: Date }) => boolean,
  { message: string; path: string[] }
] = [
  (data) => data.updatedAt >= data.createdAt,
  {
    message: 'Updated date cannot be before creation date',
    path: ['updatedAt'],
  },
];

/**
 * Common refinement for update schemas to ensure at least one field is provided
 */
export const atLeastOneFieldRefinement: [
  (data: Record<string, unknown>) => boolean,
  string
] = [
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update',
];

/**
 * Helper to create a standard ID parameter schema
 */
export const createIdParamSchema = (idField: string = 'id') =>
  z.object({
    [idField]: IDSchema,
  });

/**
 * Base entity schema with standard fields and date validation
 */
export const BaseEntitySchema = z.object(BaseEntityFields).refine(...entityDateRefinement);