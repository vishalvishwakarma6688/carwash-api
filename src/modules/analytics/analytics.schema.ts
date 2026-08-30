import { z } from 'zod';

export const getAnalyticsQuerySchema = z.object({
  query: z.object({
    businessId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
