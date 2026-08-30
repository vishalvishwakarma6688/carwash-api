import { Router } from 'express';
import {
  sendNotification,
  getMyNotifications,
  markAsRead,
} from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  sendNotificationSchema,
  markReadParamsSchema,
} from './notification.schema';

const router = Router();

router.use(authenticate);

router.post('/send', validateRequest(sendNotificationSchema), sendNotification);
router.get('/', getMyNotifications);
router.put('/:id/read', validateRequest(markReadParamsSchema), markAsRead);

export default router;
