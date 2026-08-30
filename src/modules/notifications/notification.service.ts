import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { SendNotificationInput } from './notification.schema';

export class NotificationService {
  static async sendNotification(input: SendNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'SYSTEM',
      },
    });

    return notification;
  }

  static async getUserNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return notifications;
  }

  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('Access denied to update notification');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return updated;
  }
}
