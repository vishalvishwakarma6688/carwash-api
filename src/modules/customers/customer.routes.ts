import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} from './customer.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerParamsSchema,
  getCustomersQuerySchema,
} from './customer.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createCustomerSchema), createCustomer);
router.get('/', validateRequest(getCustomersQuerySchema), getCustomers);
router.get('/:id', validateRequest(getCustomerParamsSchema), getCustomerById);
router.put('/:id', validateRequest(updateCustomerSchema), updateCustomer);

export default router;
