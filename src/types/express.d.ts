import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  businessId?: string | null;
  branchId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export {};
