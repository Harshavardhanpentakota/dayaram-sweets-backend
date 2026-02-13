import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: 'delivery' | 'payment' | 'general' | 'taxes' | 'other';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      default: 'string',
    },
    category: {
      type: String,
      enum: ['delivery', 'payment', 'general', 'taxes', 'other'],
      default: 'general',
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
SettingsSchema.index({ key: 1 });
SettingsSchema.index({ category: 1 });

export default mongoose.model<ISettings>('Settings', SettingsSchema);
