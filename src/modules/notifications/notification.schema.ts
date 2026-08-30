import { z } from 'zod';

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid User ID'),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.string().optional().default('INFO'),
  }),
});

export const markReadParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Notification ID format'),
  }),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>['body'];
