import { z } from 'zod';
import { IDSchema, DateSchema, NonEmptyStringSchema } from '@/utils/schemas/common';

export const CategorySchema = z.object({
  id: IDSchema,
  name: NonEmptyStringSchema.max(100, 'Tên danh mục phải có ít hơn 100 ký tự'),
  description: z.string().max(500, 'Mô tả phải có ít hơn 500 ký tự').optional(),
  slug: NonEmptyStringSchema.max(100, 'Slug phải ít hơn 100 ký tự'),
  createdAt: DateSchema,
  updatedAt: DateSchema
}).refine(
  (category) => category.updatedAt >= category.createdAt,
  {
    message: 'Ngày cập nhật không thể trước ngày tạo',
    path: ['updatedAt']
  }
);

export const CreateCategorySchema = z.object({
  name: NonEmptyStringSchema.max(100, 'Tên danh mục phải có ít hơn 100 ký tự'),
  description: z.string().max(500, 'Mô tả phải có ít hơn 500 ký tự').optional(),
  slug: NonEmptyStringSchema.max(100, 'Slug phải ít hơn 100 ký tự').optional(),
});

export const UpdateCategorySchema = z.object({
  name: NonEmptyStringSchema.max(100, 'Tên danh mục phải có ít hơn 100 ký tự').optional(),
  description: z.string().max(500, 'Mô tả phải có ít hơn 500 ký tự').optional(),
  slug: NonEmptyStringSchema.max(100, 'Slug phải ít hơn 100 ký tự').optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export const CategoryInputSchema = z.object({
  name: NonEmptyStringSchema.max(100),
  description: z.string().max(500).optional(),
  slug: NonEmptyStringSchema.max(100).optional(),
});
// //export const SanitizedCategoryInputSchema = CategoryInputSchema.transform((data) => ({
//     name: data.name.trim(),
//     description: data.description?.trim(),
//     slug: data.slug?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 
//           data.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
//   }));
export const SanitizedCategoryInputSchema = CategoryInputSchema.transform((data) => {
  const trimmedName = data.name.trim();
  const slugFromSlug = data.slug?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const slugFromName = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const finalSlug = (slugFromSlug && slugFromSlug.length > 0) ? slugFromSlug : slugFromName;
  
  return {
    name: trimmedName,
    description: data.description?.trim(),
    slug: finalSlug,
  };
});

export const CategoryIdParamSchema = z.object({
  id: IDSchema
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CategoryInput = z.infer<typeof CategoryInputSchema>;
export type SanitizedCategoryInput = z.infer<typeof SanitizedCategoryInputSchema>;
export type CategoryIdParams = z.infer<typeof CategoryIdParamSchema>;

