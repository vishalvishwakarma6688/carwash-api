import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'User registered successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Login successful',
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.refreshToken(req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Token refreshed successfully',
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await AuthService.logout(refreshToken);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out successfully',
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const profile = await AuthService.getProfile(userId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'User profile retrieved successfully',
    data: profile,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await AuthService.changePassword(userId, req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Password changed successfully',
  });
});
