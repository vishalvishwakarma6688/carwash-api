import { Router } from 'express';
import {
  createBusiness,
  getBusinessById,
  getAllBusinesses,
  updateBusiness,
} from './business.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createBusinessSchema,
  updateBusinessSchema,
  getBusinessParamsSchema,
} from './business.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER),
  validateRequest(createBusinessSchema),
  createBusiness
);

router.get(
  '/',
  authorizeRoles(Role.SUPER_ADMIN),
  getAllBusinesses
);

router.get(
  '/:id',
  validateRequest(getBusinessParamsSchema),
  getBusinessById
);

router.put(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER),
  validateRequest(updateBusinessSchema),
  updateBusiness
);

export default router;
