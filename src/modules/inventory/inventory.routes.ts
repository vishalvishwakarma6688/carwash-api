import { Router } from 'express';
import {
  createInventoryItem,
  getInventoryItems,
  updateStock,
} from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createInventoryItemSchema,
  updateStockSchema,
} from './inventory.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  validateRequest(createInventoryItemSchema),
  createInventoryItem
);
router.get('/', getInventoryItems);
router.put(
  '/:id/stock',
  authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER, Role.EMPLOYEE),
  validateRequest(updateStockSchema),
  updateStock
);

export default router;
