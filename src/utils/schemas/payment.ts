import { z } from 'zod';
import { PositiveNumberSchema, NonEmptyStringSchema } from './common';
import { 
  BaseEntityFields, 
  entityDateRefinement, 
  atLeastOneFieldRefinement, 
  createIdParamSchema 
} from './entity';

export const PaymentMethodSchema = z.enum([
  'credit_card',
  'bank_transfer',
  'cod',
  'momo',
  'vnpay',
  'cash'
]);

export const PaymentTransactionStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded'
]);

export const PaymentSchema = z.object({
  ...BaseEntityFields,
  orderId: NonEmptyStringSchema,
  amount: PositiveNumberSchema,
  currency: z.string().default('VND'),
  method: PaymentMethodSchema,
  status: PaymentTransactionStatusSchema.default('pending'),
  transactionId: z.string().optional(),
  paymentGateway: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(...entityDateRefinement);

export const CreatePaymentSchema = z.object({
  orderId: NonEmptyStringSchema,
  amount: PositiveNumberSchema,
  currency: z.string().default('VND').optional(),
  method: PaymentMethodSchema,
  notes: z.string().max(500).optional(),
});

export const UpdatePaymentSchema = z.object({
  status: PaymentTransactionStatusSchema.optional(),
  transactionId: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(...atLeastOneFieldRefinement);

export const PaymentIdParamSchema = createIdParamSchema();

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentTransactionStatus = z.infer<typeof PaymentTransactionStatusSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type PaymentIdParams = z.infer<typeof PaymentIdParamSchema>;