import { Router } from 'express';
import {
  createService,
  getServicesByBusiness,
  getServiceById,
  updateService,
  createPackage,
  getPackagesByBusiness,
  getPackageById,
  updatePackage,
} from './service.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createServiceSchema,
  updateServiceSchema,
  createPackageSchema,
  updatePackageSchema,
  getServiceParamsSchema,
} from './service.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Individual Car Wash Services Endpoints
router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(createServiceSchema),
  createService
);
router.get('/', getServicesByBusiness);
router.get('/:id', validateRequest(getServiceParamsSchema), getServiceById);
router.put(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(updateServiceSchema),
  updateService
);

// Service Package Endpoints
router.post(
  '/packages/create',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(createPackageSchema),
  createPackage
);
router.get('/packages/list', getPackagesByBusiness);
router.get('/packages/:id', validateRequest(getServiceParamsSchema), getPackageById);
router.put(
  '/packages/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(updatePackageSchema),
  updatePackage
);

export default router;
