import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await NotificationService.sendNotification(req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Notification dispatched successfully',
    data: notification,
  });
});

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const notifications = await NotificationService.getUserNotifications(userId);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Notifications retrieved successfully',
    data: notifications,
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const updated = await NotificationService.markAsRead(id, userId);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Notification marked as read',
    data: updated,
  });
});
