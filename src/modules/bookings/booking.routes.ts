import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
} from './booking.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  getBookingParamsSchema,
  getBookingsQuerySchema,
} from './booking.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createBookingSchema), createBooking);
router.get('/', validateRequest(getBookingsQuerySchema), getBookings);
router.get('/:id', validateRequest(getBookingParamsSchema), getBookingById);
router.put('/:id/status', validateRequest(updateBookingStatusSchema), updateBookingStatus);

export default router;
