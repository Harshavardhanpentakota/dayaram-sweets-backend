import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../../db/models/User';
import ResetPassword from '../../db/models/ResetPassword';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

// Initialize Resend lazily to avoid startup errors
let resendInstance: Resend | null = null;

const getResend = (): Resend => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured in environment variables');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for password reset
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json({ 
        message: 'If an account with that email exists, an OTP has been sent.' 
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Hash the OTP before storing
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set expiry time (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Delete any existing OTP for this user
    await ResetPassword.deleteMany({ userId: user._id });

    // Create reset password entry with OTP
    await ResetPassword.create({
      userId: user._id,
      email: user.email,
      otp: hashedOTP,
      expiresAt,
    });

    // Send email with OTP using Resend
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: user.email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Use the OTP below to reset it:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #4CAF50; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 30 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">Dayaram Sweets - Your Trusted Sweet Shop</p>
        </div>
      `,
    });

    res.status(200).json({ 
      message: 'If an account with that email exists, an OTP has been sent.',
      email: user.email
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Verify OTP and reset password
export const verifyOTPAndResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, password } = req.body;

    // Validate inputs
    if (!email || !otp || !password) {
      res.status(400).json({ message: 'Email, OTP, and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    // Hash the provided OTP
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find reset password entry
    const resetEntry = await ResetPassword.findOne({ 
      email: email.toLowerCase(),
      otp: hashedOTP
    });

    if (!resetEntry) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    // Check if OTP has expired
    const now = new Date();
    if (now > resetEntry.expiresAt) {
      await ResetPassword.deleteOne({ _id: resetEntry._id });
      res.status(400).json({ message: 'OTP has expired' });
      return;
    }

    // Find user
    const user = await User.findById(resetEntry.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Delete the OTP entry
    await ResetPassword.deleteOne({ _id: resetEntry._id });

    // Delete all other OTP entries for this user
    await ResetPassword.deleteMany({ userId: user._id });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json({ 
        message: 'If an account with that email exists, a new OTP has been sent.' 
      });
      return;
    }

    // Generate new 6-digit OTP
    const otp = generateOTP();

    // Hash the OTP before storing
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set expiry time (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Delete any existing OTP for this user
    await ResetPassword.deleteMany({ userId: user._id });

    // Create new reset password entry with OTP
    await ResetPassword.create({
      userId: user._id,
      email: user.email,
      otp: hashedOTP,
      expiresAt,
    });

    // Send email with new OTP using Resend
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: user.email,
      subject: 'Password Reset OTP - Resent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset OTP - Resent</h2>
          <p>Hello ${user.name},</p>
          <p>Here is your new OTP to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #4CAF50; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 30 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">Dayaram Sweets - Your Trusted Sweet Shop</p>
        </div>
      `,
    });

    res.status(200).json({ 
      message: 'If an account with that email exists, a new OTP has been sent.' 
    });
  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
