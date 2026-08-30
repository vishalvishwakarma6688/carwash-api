import { Router } from 'express';
import {
  createBranch,
  getBranchesByBusiness,
  getBranchById,
  updateBranch,
} from './branch.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createBranchSchema,
  updateBranchSchema,
  getBranchParamsSchema,
} from './branch.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER),
  validateRequest(createBranchSchema),
  createBranch
);

router.get('/', getBranchesByBusiness);

router.get('/:id', validateRequest(getBranchParamsSchema), getBranchById);

router.put(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(updateBranchSchema),
  updateBranch
);

export default router;
