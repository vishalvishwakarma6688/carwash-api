import { Request, Response } from 'express';
import { BranchService } from './branch.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await BranchService.createBranch(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Branch created successfully',
    data: branch,
  });
});

export const getBranchesByBusiness = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId;
  if (!businessId) {
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Business ID query parameter is required',
    });
  }

  const branches = await BranchService.getBranchesByBusiness(businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Branches retrieved successfully',
    data: branches,
  });
});

export const getBranchById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const branch = await BranchService.getBranchById(
    id,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Branch details retrieved successfully',
    data: branch,
  });
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await BranchService.updateBranch(
    id,
    req.body,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Branch updated successfully',
    data: updated,
  });
});
