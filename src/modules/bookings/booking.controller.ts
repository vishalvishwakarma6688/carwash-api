import { Request, Response } from 'express';
import { BookingService } from './booking.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';
import { BookingStatus } from '@prisma/client';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await BookingService.createBooking(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Booking created successfully',
    data: booking,
  });
});

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const query = {
    branchId: req.query.branchId as string,
    customerId: req.query.customerId as string,
    status: req.query.status as BookingStatus,
    date: req.query.date as string,
  };

  const result = await BookingService.getBookings(query, page, limit, req.user?.businessId);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Bookings retrieved successfully',
    data: result.bookings,
    meta: result.pagination,
  });
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const booking = await BookingService.getBookingById(id);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Booking details retrieved successfully',
    data: booking,
  });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await BookingService.updateBookingStatus(
    id,
    req.body,
    req.user?.userId
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Booking status updated successfully',
    data: updated,
  });
});
