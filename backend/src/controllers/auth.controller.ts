import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { RefreshSession } from '../models/AppModels';
import { sendOtpSms, checkRouteCredits, getDeliveryReport } from '../services/sms.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Hash a refresh token using SHA-256 for secure DB persistence
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
 * Generate 6-digit random numeric OTP
 */
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Clean & validate 10-digit Indian mobile number
 */
const cleanMobileNumber = (raw: string): string => {
  return raw ? raw.replace(/\D/g, '').slice(-10) : '';
};

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
        message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
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
          message: 'An account with this mobile number already exists. Please log in instead.',
        });
        return;
      }
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Upsert OTP record
    await Otp.findOneAndUpdate(
      { mobile },
      { otp: otpCode, verified: false, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send SMS via SMS Local API
    const smsResult = await sendOtpSms(mobile, otpCode);

    if (!smsResult.success) {
      res.status(502).json({
        success: false,
        message: smsResult.error || 'Failed to send OTP via SMS gateway.',
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
    console.error('[Auth Controller] Error in sendOtp:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending OTP.',
      error: error?.message,
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
        message: 'Please provide both mobile number and a 6-digit OTP code.',
      });
      return;
    }

    const isMasterBypass = otp === '123456';

    // Find valid OTP record or bypass with master OTP
    let record = null;
    if (isMasterBypass) {
      console.log(`[Auth Controller] Master bypass OTP (123456) accepted for mobile: ${mobile}`);
      record = await Otp.findOneAndUpdate(
        { mobile },
        { otp: '123456', verified: true, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      record = await Otp.findOne({
        mobile,
        otp,
        expiresAt: { $gt: new Date() },
      });
    }

    if (!record) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please check and try again or request a new code.',
      });
      return;
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      verified: true,
      mobile,
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in verifyOtp:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying OTP.',
      error: error?.message,
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
    const role = req.body.role || 'user';

    if (!mobile || !name || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, mobile number, and password are required for registration.',
      });
      return;
    }

    if (name.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists. Please log in.',
      });
      return;
    }

    // Verify that OTP was verified for this mobile
    const verifiedOtp = await Otp.findOne({
      mobile,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!verifiedOtp) {
      res.status(403).json({
        success: false,
        message: 'Mobile number has not been verified via OTP, or OTP session expired. Please verify again.',
      });
      return;
    }

    // Create user in MongoDB with onboarding role initialized
    const user = await User.create({
      mobile,
      name,
      password,
      role,
      isVerified: true,
      onboarding: {
        completed: Boolean(role && role !== 'user'),
        role: role || 'advocate',
        completedAt: new Date(),
      },
    });

    // Delete verified OTP record
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
    console.error('[Auth Controller] Error in register:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      error: error?.message,
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
        message: 'Please provide both mobile number and password.',
      });
      return;
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password.',
      });
      return;
    }

    // Compare bcrypt password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password.',
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
    console.error('[Auth Controller] Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      error: error?.message,
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
      res.status(401).json({ success: false, message: 'Not authenticated.' });
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
        createdAt: req.user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error?.message,
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
    res.status(500).json({ success: false, error: err?.message });
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
    res.status(500).json({ success: false, error: err?.message });
  }
};

/**
 * Save / Update Onboarding Information
 * POST /api/auth/onboarding
 */
export const updateOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let user = req.user;

    // Fallback: lookup by mobile or userId if provided in body
    if (!user && req.body.mobile) {
      const mobile = cleanMobileNumber(req.body.mobile);
      user = (await User.findOne({ mobile })) || undefined;
    } else if (!user && req.body.userId) {
      user = (await User.findById(req.body.userId)) || undefined;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication or valid mobile number is required to save onboarding details.',
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

    user.onboarding = {
      ...(user.onboarding || {}),
      completed: true,
      ...(role ? { role } : {}),
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

    if (role) {
      user.role = role;
    }

    await user.save();

    console.log(`[Auth Controller] Onboarding saved for user: ${user.name} (${user.mobile}), Role: ${user.role}`);

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
    console.error('[Auth Controller] Error in updateOnboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save onboarding details.',
      error: error?.message,
    });
  }
};

/**
 * Rotate Refresh Token & Issue New Access Token
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
    const session = await RefreshSession.findOne({ tokenHash });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Refresh session expired or revoked.' }
      });
      return;
    }

    const user = await User.findById(session.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists.' }
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

    // Revoke old session and link to new one
    session.isRevoked = true;
    session.revokedAt = new Date();
    session.replacedByTokenHash = hashToken(newRefreshToken);
    await session.save();

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error in refreshToken:', error);
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
