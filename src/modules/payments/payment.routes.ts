import { Router } from 'express';
import {
  processPayment,
  getPayments,
  getPaymentById,
} from './payment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createPaymentSchema,
  getPaymentParamsSchema,
} from './payment.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createPaymentSchema), processPayment);
router.get('/', getPayments);
router.get('/:id', validateRequest(getPaymentParamsSchema), getPaymentById);

export default router;
