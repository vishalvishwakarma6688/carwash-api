import { z } from 'zod';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  body: z.object({
    branchId: z.string().uuid('Invalid Branch ID'),
    customerId: z.string().uuid('Invalid Customer ID'),
    vehicleId: z.string().uuid('Invalid Vehicle ID'),
    bookingDate: z.string().datetime('Invalid booking date format (ISO 8601 string required)'),
    timeSlot: z.string().min(1, 'Time slot is required (e.g., "10:00 AM - 10:30 AM")'),
    serviceIds: z.array(z.string().uuid()).optional().default([]),
    packageId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Booking ID format'),
  }),
  body: z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    notes: z.string().optional(),
  }),
});

export const getBookingParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Booking ID format'),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    branchId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    date: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>['body'];
