import { Router } from 'express';
import {
  createVehicle,
  getVehiclesByCustomer,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from './vehicle.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  getVehicleParamsSchema,
  getCustomerVehiclesParamsSchema,
} from './vehicle.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createVehicleSchema), createVehicle);
router.get('/customer/:customerId', validateRequest(getCustomerVehiclesParamsSchema), getVehiclesByCustomer);
router.get('/:id', validateRequest(getVehicleParamsSchema), getVehicleById);
router.put('/:id', validateRequest(updateVehicleSchema), updateVehicle);
router.delete('/:id', validateRequest(getVehicleParamsSchema), deleteVehicle);

export default router;
