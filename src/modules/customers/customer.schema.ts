import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name must be at least 2 characters'),
    phone: z.string().min(5, 'Phone number is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
    businessId: z.string().uuid('Invalid Business ID').optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Customer ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const getCustomerParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Customer ID format'),
  }),
});

export const getCustomersQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    businessId: z.string().uuid().optional(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
