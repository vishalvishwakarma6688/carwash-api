import { z } from 'zod';
import { QueueStatus, VehicleType } from '@prisma/client';

export const createWalkInSchema = z.object({
  body: z.object({
    branchId: z.string().uuid('Invalid Branch ID'),
    customerName: z.string().min(2, 'Customer name is required'),
    customerPhone: z.string().min(5, 'Customer phone number is required'),
    plateNumber: z.string().min(2, 'Vehicle plate number is required'),
    brand: z.string().min(1, 'Vehicle brand is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    vehicleType: z.nativeEnum(VehicleType).optional().default(VehicleType.SEDAN),
    serviceIds: z.array(z.string().uuid()).optional().default([]),
    packageId: z.string().uuid().optional(),
    priority: z.number().int().optional().default(0),
    notes: z.string().optional(),
  }),
});

export const updateQueueStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Queue Item ID format'),
  }),
  body: z.object({
    status: z.nativeEnum(QueueStatus).optional(),
    assignedEmployeeId: z.string().uuid().optional(),
    priority: z.number().int().optional(),
    notes: z.string().optional(),
  }),
});

export const getBranchQueueParamsSchema = z.object({
  params: z.object({
    branchId: z.string().uuid('Invalid Branch ID format'),
  }),
});

export type CreateWalkInInput = z.infer<typeof createWalkInSchema>['body'];
export type UpdateQueueStatusInput = z.infer<typeof updateQueueStatusSchema>['body'];
