import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { RefreshSession } from '../models/AppModels';
import { sendOtpSms, checkRouteCredits, getDeliveryReport } from '../services/sms.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Hash a token or OTP using SHA-256 for secure DB persistence
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate Access and Refresh Token pair with DB session
 */
const generateTokenPair = async (userId: string, mobile: string, role: string, ip?: string, userAgent?: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'draftmate_jwt_secret_dev_key';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (jwtSecret + '_refresh');

  // Short-lived Access Token (15 mins) and Long-lived Refresh Token (15 days)
  const accessToken = jwt.sign(
    { id: userId, mobile, role },
    jwtSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId, tokenType: 'refresh', nonce: crypto.randomUUID() },
    refreshSecret,
    { expiresIn: '15d' }
  );

  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const tokenHash = hashToken(refreshToken);

  await RefreshSession.create({
    userId,
    tokenHash,
    deviceInfo: userAgent || 'Unknown Device',
    ipAddress: ip || '127.0.0.1',
    expiresAt,
    isRevoked: false
  });

  return { accessToken, refreshToken };
};

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Clean & validate 10-digit Indian mobile number
 */
const cleanMobileNumber = (raw: string): string => {
  return raw ? raw.replace(/\D/g, '').slice(-10) : '';
};

/**
 * Allowed roles for self-registration. Privileged roles like admin/firm_admin require explicit verified invites.
 */
const ALLOWED_SELF_ROLES = ['advocate', 'student', 'citizen'];

/**
 * STEP 1: Send OTP to Mobile
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawMobile = req.body.mobile;
    const mobile = cleanMobileNumber(rawMobile);

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_MOBILE', message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' },
      });
      return;
    }

    // Check optional purpose: if registering, check if already registered
    const { purpose } = req.body;
    if (purpose === 'register') {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'ACCOUNT_EXISTS', message: 'An account with this mobile number already exists. Please log in instead.' },
        });
        return;
      }
    }

    // Check existing OTP for lock status or cooldown
    const existingOtp = await Otp.findOne({ mobile });
    if (existingOtp) {
      if (existingOtp.isLocked && existingOtp.expiresAt > new Date()) {
        res.status(423).json({
          success: false,
          error: { code: 'OTP_LOCKED', message: 'Too many failed attempts. This number is locked for OTP verification. Please wait a few minutes before trying again.' }
        });
        return;
      }

      // 60-second resend cooldown
      const secondsSinceLastRequest = (Date.now() - new Date(existingOtp.lastRequestedAt || existingOtp.createdAt).getTime()) / 1000;
      if (secondsSinceLastRequest < 60) {
        const remainingSeconds = Math.ceil(60 - secondsSinceLastRequest);
        res.status(429).json({
          success: false,
          error: { code: 'RESEND_COOLDOWN', message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.` }
        });
        return;
      }
    }

    const otpCode = generateOtp();
    const otpHash = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Upsert OTP record storing only SHA-256 hash
    await Otp.findOneAndUpdate(
      { mobile },
      {
        otpHash,
        verified: false,
        attempts: 0,
        isLocked: false,
        expiresAt,
        lastRequestedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send SMS via SMS Local API
    const smsResult = await sendOtpSms(mobile, otpCode);

    if (!smsResult.success) {
      res.status(502).json({
        success: false,
        error: { code: 'SMS_GATEWAY_ERROR', message: smsResult.error || 'Failed to send OTP via SMS gateway.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your mobile number.',
      mobile,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in sendOtp:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error while sending OTP.' },
    });
  }
};

/**
 * STEP 2: Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawMobile = req.body.mobile;
    const mobile = cleanMobileNumber(rawMobile);
    const otp = req.body.otp ? String(req.body.otp).trim() : '';

    if (!mobile || !otp || otp.length !== 6) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Please provide both mobile number and a 6-digit OTP code.' },
      });
      return;
    }

    // Bypass is strictly isolated to explicit automated test environments
    const isMasterBypass =
      process.env.NODE_ENV === 'test' &&
      process.env.ALLOW_TEST_OTP_BYPASS === 'true' &&
      otp === '123456';

    const record = await Otp.findOne({ mobile, expiresAt: { $gt: new Date() } });

    if (!record) {
      res.status(400).json({
        success: false,
        error: { code: 'OTP_EXPIRED_OR_NOT_FOUND', message: 'Invalid or expired OTP code. Please request a new code.' },
      });
      return;
    }

    if (record.isLocked) {
      res.status(423).json({
        success: false,
        error: { code: 'OTP_LOCKED', message: 'Too many incorrect attempts. This OTP is locked. Please request a new OTP.' },
      });
      return;
    }

    const inputHash = hashToken(otp);
    const isMatch = isMasterBypass || record.otpHash === inputHash;

    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      const maxAttempts = record.maxAttempts || 5;

      if (record.attempts >= maxAttempts) {
        record.isLocked = true;
        await record.save();
        res.status(423).json({
          success: false,
          error: { code: 'MAX_ATTEMPTS_EXCEEDED', message: 'Maximum verification attempts exceeded. Please request a new OTP.' }
        });
        return;
      }

      await record.save();
      const remainingAttempts = maxAttempts - record.attempts;
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: `Incorrect OTP. ${remainingAttempts} attempts remaining.` },
      });
      return;
    }

    // Mark as verified and reset attempts
    record.verified = true;
    record.attempts = 0;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      verified: true,
      mobile,
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in verifyOtp:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error while verifying OTP.' },
    });
  }
};

/**
 * STEP 3: Complete Registration
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawMobile = req.body.mobile;
    const mobile = cleanMobileNumber(rawMobile);
    const name = req.body.name ? String(req.body.name).trim() : '';
    const password = req.body.password ? String(req.body.password) : '';
    const requestedRole = req.body.role;

    if (!mobile || !name || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Name, mobile number, and password are required for registration.' },
      });
      return;
    }

    if (name.length < 2) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Name must be at least 2 characters long.' },
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' },
      });
      return;
    }

    // Role Sanitization: Never allow caller to self-assign admin/firm_admin
    const safeRole = ALLOWED_SELF_ROLES.includes(requestedRole) ? requestedRole : 'advocate';

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this mobile number already exists. Please log in.' },
      });
      return;
    }

    // Verify that OTP was completed for this mobile
    const verifiedOtp = await Otp.findOne({
      mobile,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!verifiedOtp) {
      res.status(403).json({
        success: false,
        error: { code: 'UNVERIFIED_PHONE', message: 'Mobile number has not been verified via OTP, or OTP session expired. Please verify again.' },
      });
      return;
    }

    // Create user in MongoDB with sanitized role
    const user = await User.create({
      mobile,
      name,
      password,
      role: safeRole,
      isVerified: true,
      onboarding: {
        completed: Boolean(safeRole && safeRole !== 'user'),
        role: safeRole,
        completedAt: new Date(),
      },
    });

    // Invalidate verified OTP so it cannot be reused
    await Otp.deleteMany({ mobile });

    // Generate Access & Refresh Tokens
    const { accessToken, refreshToken } = await generateTokenPair(
      user._id.toString(),
      user.mobile,
      user.role,
      req.ip,
      req.headers['user-agent'] as string
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        onboarding: user.onboarding,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in register:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: 'Internal server error during registration.' },
    });
  }
};

/**
 * LOGIN: Mobile number + Password
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawMobile = req.body.mobile;
    const mobile = cleanMobileNumber(rawMobile);
    const password = req.body.password ? String(req.body.password) : '';

    if (!mobile || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Please provide both mobile number and password.' },
      });
      return;
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid mobile number or password.' },
      });
      return;
    }

    // Compare bcrypt password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid mobile number or password.' },
      });
      return;
    }

    // Generate Access & Refresh Tokens
    const { accessToken, refreshToken } = await generateTokenPair(
      user._id.toString(),
      user.mobile,
      user.role,
      req.ip,
      req.headers['user-agent'] as string
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        onboarding: user.onboarding,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in login:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Internal server error during login.' },
    });
  }
};

/**
 * Current Authenticated User Profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        role: req.user.role,
        isVerified: req.user.isVerified,
        onboarding: req.user.onboarding,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PROFILE_ERROR', message: 'Failed to retrieve user profile.' },
    });
  }
};

/**
 * Check SMS Credits
 * GET /api/auth/sms/credits
 */
export const getSmsCredits = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await checkRouteCredits(process.env.SMS_ROUTE || '2');
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SMS_CREDITS_ERROR', message: err?.message } });
  }
};

/**
 * Check SMS Delivery Status
 * GET /api/auth/sms/delivery/:messageId
 */
export const getSmsDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.messageId;
    const messageId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
    const data = await getDeliveryReport(messageId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SMS_DELIVERY_ERROR', message: err?.message } });
  }
};

/**
 * Save / Update Onboarding Information
 * Strictly bound to authenticated user. Rejects spoofed client-supplied userIds or mobile numbers.
 * POST /api/auth/onboarding
 */
export const updateOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication is required to save onboarding details.' },
      });
      return;
    }

    const {
      role,
      enrollmentId,
      practiceAreas,
      experience,
      collegeName,
      academicYear,
      firmName,
      firmPosition,
      firmSize,
      legalNeed,
      industry,
    } = req.body;

    // Sanitize role: only allow self-service roles
    const safeRole = role && ALLOWED_SELF_ROLES.includes(role) ? role : undefined;

    user.onboarding = {
      ...(user.onboarding || {}),
      completed: true,
      ...(safeRole ? { role: safeRole } : {}),
      ...(enrollmentId !== undefined ? { enrollmentId } : {}),
      ...(practiceAreas !== undefined ? { practiceAreas } : {}),
      ...(experience !== undefined ? { experience } : {}),
      ...(collegeName !== undefined ? { collegeName } : {}),
      ...(academicYear !== undefined ? { academicYear } : {}),
      ...(firmName !== undefined ? { firmName } : {}),
      ...(firmPosition !== undefined ? { firmPosition } : {}),
      ...(firmSize !== undefined ? { firmSize } : {}),
      ...(legalNeed !== undefined ? { legalNeed } : {}),
      ...(industry !== undefined ? { industry } : {}),
      completedAt: new Date(),
    };

    if (safeRole) {
      user.role = safeRole;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding details saved successfully.',
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        onboarding: user.onboarding,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in updateOnboarding:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'ONBOARDING_ERROR', message: 'Failed to save onboarding details.' },
    });
  }
};

/**
 * Rotate Refresh Token & Issue New Access Token
 * Atomically revokes old session and detects replay attacks
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRefreshToken = req.body.refreshToken;
    if (!rawRefreshToken) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token is required.' }
      });
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);

    // Atomic find and revoke: ensures only ONE consumer can succeed
    const oldSession = await RefreshSession.findOneAndUpdate(
      { tokenHash, isRevoked: false, expiresAt: { $gt: new Date() } },
      { isRevoked: true, revokedAt: new Date() },
      { new: false }
    );

    if (!oldSession) {
      // Check if this was a compromised already-revoked token being replayed
      const revokedSession = await RefreshSession.findOne({ tokenHash });
      if (revokedSession && revokedSession.isRevoked) {
        // TOKEN REPLAY ATTACK: Revoke all sessions for this user family
        await RefreshSession.updateMany(
          { userId: revokedSession.userId, isRevoked: false },
          { isRevoked: true, revokedAt: new Date() }
        );

        res.status(403).json({
          success: false,
          error: { code: 'TOKEN_REUSE_DETECTED', message: 'Compromised token re-use detected. All sessions have been terminated for security.' }
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Refresh session expired, invalid, or already revoked.' }
      });
      return;
    }

    const user = await User.findById(oldSession.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User belonging to this session no longer exists.' }
      });
      return;
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(
      user._id.toString(),
      user.mobile,
      user.role,
      req.ip,
      req.headers['user-agent'] as string
    );

    // Link old session to new session hash
    oldSession.replacedByTokenHash = hashToken(newRefreshToken);
    await oldSession.save();

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in refreshToken:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
};

/**
 * Revoke Current Refresh Session (Logout)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRefreshToken = req.body.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshSession.findOneAndUpdate(
        { tokenHash },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: error.message }
    });
  }
};

/**
 * Revoke All Sessions for User (Logout Everywhere)
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    await RefreshSession.updateMany(
      { userId: userId.toString(), isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All active sessions have been revoked.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ALL_ERROR', message: error.message }
    });
  }
};
