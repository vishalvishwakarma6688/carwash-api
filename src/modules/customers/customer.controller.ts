import { Request, Response } from 'express';
import { CustomerService } from './customer.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.createCustomer(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Customer created successfully',
    data: customer,
  });
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId;
  if (!businessId) {
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Business ID is required',
    });
  }

  const search = req.query.search as string;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await CustomerService.getCustomers(businessId, search, page, limit);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Customers retrieved successfully',
    data: result.customers,
    meta: result.pagination,
  });
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await CustomerService.getCustomerById(
    id,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Customer details retrieved successfully',
    data: customer,
  });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await CustomerService.updateCustomer(
    id,
    req.body,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Customer updated successfully',
    data: updated,
  });
});
