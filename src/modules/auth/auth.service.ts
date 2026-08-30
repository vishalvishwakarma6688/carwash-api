import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './auth.schema';
import { JwtPayload } from '../../types/express';

export class AuthService {
  /**
   * Helper: Generate Access and Refresh JWT Tokens
   */
  private static generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  /**
   * Register a new User & automatically link Business/Customer entity if applicable
   */
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    let businessId: string | undefined = input.businessId;

    // If role is BUSINESS_OWNER, create a default Business entry
    if (input.role === Role.BUSINESS_OWNER && input.businessName) {
      const business = await prisma.business.create({
        data: {
          name: input.businessName,
          email: input.email,
          phone: input.phone || '',
        },
      });
      businessId = business.id;
    }

    // Create User
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        fullName: input.fullName,
        phone: input.phone,
        role: input.role || Role.CUSTOMER,
        businessId: businessId || null,
        branchId: input.branchId || null,
      },
    });

    // If CUSTOMER role, automatically create Customer record
    if (user.role === Role.CUSTOMER) {
      // If no businessId yet, user will be associated with tenant upon business context
      if (businessId) {
        await prisma.customer.create({
          data: {
            businessId,
            userId: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phone || '',
          },
        });
      }
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      branchId: user.branchId,
    };

    const tokens = this.generateTokens(payload);

    // Persist refresh token in DB
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId,
      },
      tokens,
    };
  }

  /**
   * User Login
   */
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      branchId: user.branchId,
    };

    const tokens = this.generateTokens(payload);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId,
      },
      tokens,
    };
  }

  /**
   * Refresh Access Token with Token Rotation
   */
  static async refreshToken(input: RefreshTokenInput) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || new Date() > tokenRecord.expiresAt) {
      throw ApiError.unauthorized('Refresh token is invalid or expired');
    }

    // Revoke current refresh token (Rotation strategy)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const user = tokenRecord.user;
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User associated with token is inactive');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      branchId: user.branchId,
    };

    const tokens = this.generateTokens(payload);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    return tokens;
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }
    return true;
  }

  /**
   * Get authenticated user profile
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        businessId: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        business: {
          select: { id: true, name: true, logo: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return user;
  }

  /**
   * Change User Password
   */
  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newHashedPassword = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    // Revoke all existing refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return true;
  }
}
