import { z } from 'zod';
import { BookingStatus, PaymentStatus, ServiceLocationType } from '@prisma/client';

export const createBookingSchema = z.object({
  body: z.object({
    branchId: z.string().min(1, 'Branch or Business ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    vehicleId: z.string().optional().default(''),
    locationType: z.nativeEnum(ServiceLocationType).optional().default(ServiceLocationType.IN_BRANCH),
    address: z.string().optional(),
    landmark: z.string().optional(),
    doorstepFee: z.number().nonnegative().optional().default(0),
    bookingDate: z.string().min(1, 'Booking date is required'),
    timeSlot: z.string().min(1, 'Time slot is required'),
    serviceIds: z.array(z.string()).optional().default([]),
    packageId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    notes: z.string().optional(),
  }),
});

export const getBookingParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    branchId: z.string().optional(),
    customerId: z.string().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    date: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>['body'];
