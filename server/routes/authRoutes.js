import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  logoutUser, 
  refreshAccessToken, 
  forgotPassword, 
  resetPassword,
  toggleFavoriteProperty,
  verifyOtp,
  resendOtp,
  emailConfigStatus
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/email-config-status', emailConfigStatus);
router.post('/logout', protect, logoutUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.post('/favorites/:id', protect, toggleFavoriteProperty);

export default router;
