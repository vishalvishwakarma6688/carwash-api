import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  body: z.object({
    branchId: z.string().uuid('Invalid Branch ID'),
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    sku: z.string().min(2, 'SKU is required'),
    quantity: z.number().int().nonnegative().optional().default(0),
    minStockLevel: z.number().int().nonnegative().optional().default(10),
    unitPrice: z.number().nonnegative().optional().default(0),
    businessId: z.string().uuid().optional(),
  }),
});

export const updateStockSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Inventory Item ID format'),
  }),
  body: z.object({
    quantityDelta: z.number().int().optional(), // Positive for Stock In, Negative for Stock Out
    minStockLevel: z.number().int().nonnegative().optional(),
    unitPrice: z.number().nonnegative().optional(),
    name: z.string().min(2).optional(),
  }),
});

export const getInventoryParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Inventory Item ID format'),
  }),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>['body'];
export type UpdateStockInput = z.infer<typeof updateStockSchema>['body'];
