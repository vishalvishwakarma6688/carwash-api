import { z } from 'zod';

export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Business name must be at least 2 characters long'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(5, 'Phone number must be provided'),
    address: z.string().optional(),
    logo: z.string().url('Logo must be a valid URL').optional(),
  }),
});

export const updateBusinessSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Business ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    address: z.string().optional(),
    logo: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBusinessParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Business ID format'),
  }),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>['body'];
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>['body'];
