import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/error.middleware';
import { ApiError } from './utils/apiError';
import { sendResponse } from './utils/apiResponse';
import { HTTP_STATUS } from './constants/httpStatusCodes';

// Import Module Routers
import authRoutes from './modules/auth/auth.routes';
import businessRoutes from './modules/businesses/business.routes';
import branchRoutes from './modules/branches/branch.routes';
import customerRoutes from './modules/customers/customer.routes';
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import serviceRoutes from './modules/services/service.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import queueRoutes from './modules/queue/queue.routes';
import paymentRoutes from './modules/payments/payment.routes';
import employeeRoutes from './modules/employees/employee.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Health Check Endpoint
app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Car Wash Backend API is healthy and operational',
    data: {
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes Mounting
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/businesses`, businessRoutes);
app.use(`${env.API_PREFIX}/branches`, branchRoutes);
app.use(`${env.API_PREFIX}/customers`, customerRoutes);
app.use(`${env.API_PREFIX}/vehicles`, vehicleRoutes);
app.use(`${env.API_PREFIX}/services`, serviceRoutes);
app.use(`${env.API_PREFIX}/bookings`, bookingRoutes);
app.use(`${env.API_PREFIX}/queue`, queueRoutes);
app.use(`${env.API_PREFIX}/payments`, paymentRoutes);
app.use(`${env.API_PREFIX}/employees`, employeeRoutes);
app.use(`${env.API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${env.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${env.API_PREFIX}/analytics`, analyticsRoutes);

// Catch-all 404 for undefined routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound('Requested API route does not exist'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
