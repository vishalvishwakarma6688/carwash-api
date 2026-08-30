import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid User ID'),
    branchId: z.string().uuid('Invalid Branch ID'),
    employmentStatus: z.string().optional().default('ACTIVE'),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Employee ID format'),
  }),
  body: z.object({
    branchId: z.string().uuid().optional(),
    employmentStatus: z.string().optional(),
  }),
});

export const getEmployeeParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Employee ID format'),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
