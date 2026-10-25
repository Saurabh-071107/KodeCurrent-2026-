import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  register,
  login,
  getMe,
  getSmsCredits,
  getSmsDelivery,
  updateOnboarding,
  refreshToken,
  logout,
  logoutAll,
} from '../controllers/auth.controller';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Registration & Verification flow
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);

// Login & Session Management
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authenticateToken, logoutAll);

// Onboarding Details (Strictly Authenticated)
router.post('/onboarding', authenticateToken, updateOnboarding);

// Authenticated User profile
router.get('/me', authenticateToken, getMe);

// SMS Utilities & Status
router.get('/sms/credits', getSmsCredits);
router.get('/sms/delivery/:messageId', getSmsDelivery);

export default router;
