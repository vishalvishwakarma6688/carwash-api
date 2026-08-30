import { Request, Response } from 'express';
import { BusinessService } from './business.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const business = await BusinessService.createBusiness(req.body, userId);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Business created successfully',
    data: business,
  });
});

export const getBusinessById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await BusinessService.getBusinessById(
    id,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Business details retrieved successfully',
    data: business,
  });
});

export const getAllBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await BusinessService.getAllBusinesses(page, limit);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Businesses list retrieved successfully',
    data: result.businesses,
    meta: result.pagination,
  });
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await BusinessService.updateBusiness(
    id,
    req.body,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Business profile updated successfully',
    data: updated,
  });
});
