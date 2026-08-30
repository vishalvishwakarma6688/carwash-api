import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid Booking ID'),
    amount: z.number().positive('Payment amount must be greater than 0'),
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    transactionId: z.string().optional(),
    status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PAID),
  }),
});

export const getPaymentParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Payment ID format'),
  }),
});

export const getBookingPaymentParamsSchema = z.object({
  params: z.object({
    bookingId: z.string().uuid('Invalid Booking ID format'),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
