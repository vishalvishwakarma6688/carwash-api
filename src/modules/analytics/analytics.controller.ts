import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId;
  if (!businessId) {
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Business ID is required for metrics query',
    });
  }

  const metrics = await AnalyticsService.getDashboardMetrics(businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Dashboard metrics retrieved successfully',
    data: metrics,
  });
});

export const getPopularServices = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId;
  if (!businessId) {
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Business ID is required',
    });
  }

  const popular = await AnalyticsService.getPopularServices(businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Popular services metrics retrieved successfully',
    data: popular,
  });
});
