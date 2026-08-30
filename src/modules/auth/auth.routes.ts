import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
} from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getProfile);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), changePassword);

export default router;
