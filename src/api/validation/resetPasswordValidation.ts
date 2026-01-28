import { z } from 'zod';

// Send OTP Schema
export const sendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// Verify OTP and Reset Password Schema
export const verifyOTPAndResetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Resend OTP Schema
export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPAndResetPasswordInput = z.infer<typeof verifyOTPAndResetPasswordSchema>;
export type ResendOTPInput = z.infer<typeof resendOTPSchema>;
