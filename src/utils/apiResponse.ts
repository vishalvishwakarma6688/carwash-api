import { Response } from 'express';
import { HttpStatusCode, HTTP_STATUS } from '../constants/httpStatusCodes';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: HttpStatusCode;
  message?: string;
  data?: T;
  meta?: any;
}

export function sendResponse<T>({
  res,
  statusCode = HTTP_STATUS.OK,
  message = 'Operation successful',
  data,
  meta,
}: ApiResponseOptions<T>) {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data: data !== undefined ? data : null,
    meta,
    timestamp: new Date().toISOString(),
  });
}
