import { z } from 'zod';
import { VehicleType } from '@prisma/client';

export const createVehicleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid Customer ID'),
    plateNumber: z.string().min(2, 'License plate number is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    color: z.string().optional(),
    vehicleType: z.nativeEnum(VehicleType).optional().default(VehicleType.SEDAN),
    year: z.number().int().optional(),
    notes: z.string().optional(),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Vehicle ID format'),
  }),
  body: z.object({
    plateNumber: z.string().min(2).optional(),
    brand: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    color: z.string().optional(),
    vehicleType: z.nativeEnum(VehicleType).optional(),
    year: z.number().int().optional(),
    notes: z.string().optional(),
  }),
});

export const getVehicleParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Vehicle ID format'),
  }),
});

export const getCustomerVehiclesParamsSchema = z.object({
  params: z.object({
    customerId: z.string().uuid('Invalid Customer ID format'),
  }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
