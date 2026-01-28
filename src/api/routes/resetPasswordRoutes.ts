import { Router } from 'express';
import {
  sendOTP,
  verifyOTPAndResetPassword,
  resendOTP,
} from '../controllers/resetPasswordController';
import { validate } from '../middleware/validate';
import {
  sendOTPSchema,
  verifyOTPAndResetPasswordSchema,
  resendOTPSchema,
} from '../validation/resetPasswordValidation';

const router = Router();

// Send OTP to email for password reset
router.post('/send-otp', validate(sendOTPSchema), sendOTP);

// Verify OTP and reset password
router.post('/verify-otp', validate(verifyOTPAndResetPasswordSchema), verifyOTPAndResetPassword);

// Resend OTP
router.post('/resend-otp', validate(resendOTPSchema), resendOTP);

export default router;
