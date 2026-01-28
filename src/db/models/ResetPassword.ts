import mongoose, { Schema, Document } from 'mongoose';

export interface IResetPassword extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

const ResetPasswordSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required'],
  },
});

// Index for faster queries and automatic cleanup
ResetPasswordSchema.index({ email: 1 });
ResetPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

export default mongoose.model<IResetPassword>('ResetPassword', ResetPasswordSchema);
