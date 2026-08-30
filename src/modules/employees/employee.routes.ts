import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
} from './employee.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeParamsSchema,
} from './employee.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(createEmployeeSchema),
  createEmployee
);

router.get('/', getEmployees);
router.get('/:id', validateRequest(getEmployeeParamsSchema), getEmployeeById);

router.put(
  '/:id',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(updateEmployeeSchema),
  updateEmployee
);

export default router;
