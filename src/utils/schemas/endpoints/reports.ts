import { z } from 'zod';
import { createEndpointResponseSchema } from '../responses/common';

/**
 * Query parameters for generating a sales report
 */
export const SalesReportQuerySchema = z.object({
  startDate: z.string().describe('Start date in ISO format (e.g., 2023-01-01)').optional(),
  endDate: z.string().describe('End date in ISO format (e.g., 2023-12-31)').optional(),
});

/**
 * Summary statistics for the sales report
 */
export const SalesSummarySchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  completedOrders: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
  cancelledOrders: z.number().int().nonnegative(),
});

/**
 * Daily breakdown of sales data
 */
export const DailySalesSchema = z.object({
  date: z.string().describe('Date in YYYY-MM-DD format'),
  revenue: z.number().nonnegative(),
  orderCount: z.number().int().nonnegative(),
});

/**
 * The full sales report data structure
 */
export const SalesReportDataSchema = z.object({
  sellerId: z.string(),
  summary: SalesSummarySchema,
  dailySales: z.array(DailySalesSchema),
  generatedAt: z.string().describe('ISO timestamp of when the report was generated'),
});

/**
 * API Response schema for the sales report
 */
export const SalesReportResponseSchema = createEndpointResponseSchema(SalesReportDataSchema);

export type SalesReportQuery = z.infer<typeof SalesReportQuerySchema>;
export type SalesReportData = z.infer<typeof SalesReportDataSchema>;
export type SalesReportResponse = z.infer<typeof SalesReportResponseSchema>;