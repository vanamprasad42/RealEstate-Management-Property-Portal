import User from '../models/userModel.js';
import Property from '../models/propertyModel.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';

// Set refresh token in HTTP-only cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: role || 'user',
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      user.refreshToken = refreshToken;
      await user.save();

      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        token: accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token (Triggers Real-time Email OTP)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked.' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();
      console.log(`[AUTH] Generated real-time OTP for ${user.email}: ${otp}`);

      // Send real-time OTP via email
      try {
        await sendEmail({
          email: user.email,
          subject: 'RealEstate OTP Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; text-align: center;">Two-Factor Authentication OTP</h2>
              <p>Hello ${user.name},</p>
              <p>Use the following 6-digit verification code to complete your login. This code is valid for 5 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; border: 2px dashed #4f46e5; padding: 10px 20px; border-radius: 8px; display: inline-block;">${otp}</span>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">If you did not attempt to login, please secure your account.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(`[AUTH ERROR] Failed to send real-time OTP email to ${user.email}:`, emailError.message);
        return res.status(500).json({ 
          message: 'Failed to send verification email. Please verify EMAIL_USER & EMAIL_PASSWORD settings on your server.' 
        });
      }

      res.json({ 
        requiresOtp: true, 
        email: user.email,
        message: 'OTP has been sent to your email.'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend real-time OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();
    console.log(`[AUTH] Resent real-time OTP for ${user.email}: ${otp}`);

    await sendEmail({
      email: user.email,
      subject: 'RealEstate New OTP Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">New OTP Code</h2>
          <p>Hello ${user.name},</p>
          <p>Here is your new 6-digit verification code. This code is valid for 5 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; border: 2px dashed #4f46e5; padding: 10px 20px; border-radius: 8px; display: inline-block;">${otp}</span>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'A fresh OTP verification code has been sent to your email.' });
  } catch (error) {
    console.error('[AUTH ERROR] Resend OTP failed:', error.message);
    res.status(500).json({ message: error.message || 'Failed to resend OTP email.' });
  }
};

// @desc    Verify real-time OTP and complete login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidOtp = user.otp && user.otp === otp && user.otpExpire > Date.now();

    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please check your email or request a new code.' });
    }

    // Clear OTP details after successful verification
    user.otp = undefined;
    user.otpExpire = undefined;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      token: accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Not authorized, no refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, token mismatch or user not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Token refresh failed or expired' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('favorites');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send recovery link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    // HTML email body
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded-lg">
        <h2 style="color: #4f46e5; text-align: center;">RealEstate Platform Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[DEV] Password Reset Link: ${resetUrl}`);
    }

    try {
      await sendEmail({
        email: user.email,
        subject: 'RealEstate Password Reset Request',
        html,
      });
      res.json({ 
        message: 'Password reset link sent to your email.',
        ...(isDev ? { devLink: resetUrl } : {})
      });
    } catch (emailError) {
      console.error(`[DEV] Failed to send password reset email:`, emailError.message);
      console.log(`[DEV] Password Reset Link: ${resetUrl}`);
      
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
      }
      
      res.json({ 
        message: 'Password reset link generated (logged to server console in development).',
        devLink: resetUrl
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle property in favorites (Wishlist)
// @route   POST /api/auth/favorites/:id
// @access  Private
export const toggleFavoriteProperty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const propertyId = req.params.id;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isFav = user.favorites.includes(propertyId);

    if (isFav) {
      user.favorites = user.favorites.filter((favId) => favId.toString() !== propertyId);
    } else {
      user.favorites.push(propertyId);
    }

    await user.save();
    res.json({ favorites: user.favorites, isFavorite: !isFav });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

