import { Router } from 'express';
import {
  getDashboardMetrics,
  getPopularServices,
} from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(Role.SUPER_ADMIN, Role.BUSINESS_OWNER, Role.BRANCH_MANAGER));

router.get('/dashboard', getDashboardMetrics);
router.get('/popular-services', getPopularServices);

export default router;
