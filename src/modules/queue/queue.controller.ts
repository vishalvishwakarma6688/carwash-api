import { Request, Response } from 'express';
import { QueueService } from './queue.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createWalkIn = asyncHandler(async (req: Request, res: Response) => {
  const queueItem = await QueueService.createWalkIn(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Walk-in customer registered and queued successfully',
    data: queueItem,
  });
});

export const getBranchQueue = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.params;
  const queue = await QueueService.getBranchQueue(branchId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Active branch queue retrieved successfully',
    data: queue,
  });
});

export const updateQueueStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await QueueService.updateQueueStatus(
    id,
    req.body,
    req.user?.userId
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Queue item updated successfully',
    data: updated,
  });
});
