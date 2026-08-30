import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters long'),
    address: z.string().min(5, 'Address is required'),
    phone: z.string().min(5, 'Phone number is required'),
    operatingHours: z.string().optional(),
    capacity: z.number().int().positive().optional().default(5),
    businessId: z.string().uuid('Invalid Business ID').optional(),
  }),
});

export const updateBranchSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Branch ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    phone: z.string().min(5).optional(),
    operatingHours: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBranchParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Branch ID format'),
  }),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>['body'];
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>['body'];
