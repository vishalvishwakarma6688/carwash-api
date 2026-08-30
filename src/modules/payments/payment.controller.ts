import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.processPayment(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Payment processed successfully',
    data: payment,
  });
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const branchId = req.query.branchId as string;

  const result = await PaymentService.getPayments(
    req.user?.businessId,
    branchId,
    page,
    limit
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Payment transactions retrieved successfully',
    data: result.payments,
    meta: result.pagination,
  });
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = await PaymentService.getPaymentById(id);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Payment details retrieved successfully',
    data: payment,
  });
});
