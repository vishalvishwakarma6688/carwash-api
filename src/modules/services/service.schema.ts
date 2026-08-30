import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Service name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than 0'),
    estimatedDurationMinutes: z.number().int().positive().optional().default(30),
    supportedVehicleTypes: z.string().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Service ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    estimatedDurationMinutes: z.number().int().positive().optional(),
    supportedVehicleTypes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Package name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Package price must be greater than 0'),
    estimatedDurationMinutes: z.number().int().positive().optional().default(60),
    serviceIds: z.array(z.string().uuid('Invalid Service ID in array')).min(1, 'At least one service required'),
    businessId: z.string().uuid().optional(),
  }),
});

export const updatePackageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Package ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    estimatedDurationMinutes: z.number().int().positive().optional(),
    serviceIds: z.array(z.string().uuid()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getServiceParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];
export type CreatePackageInput = z.infer<typeof createPackageSchema>['body'];
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>['body'];
