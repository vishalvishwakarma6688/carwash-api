import { Router } from 'express';
import {
  createWalkIn,
  getBranchQueue,
  updateQueueStatus,
} from './queue.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createWalkInSchema,
  updateQueueStatusSchema,
  getBranchQueueParamsSchema,
} from './queue.schema';

const router = Router();

router.use(authenticate);

router.post('/walk-in', validateRequest(createWalkInSchema), createWalkIn);
router.get('/branch/:branchId', validateRequest(getBranchQueueParamsSchema), getBranchQueue);
router.put('/:id/status', validateRequest(updateQueueStatusSchema), updateQueueStatus);

export default router;
