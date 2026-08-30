import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS } from '../constants/httpStatusCodes';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Log error details
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    logger.error(`[Unhandled Exception] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Mask internal database or system error details in production
  if (env.NODE_ENV === 'production' && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    message = 'An unexpected internal error occurred';
    errors = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};
