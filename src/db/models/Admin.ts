import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  role: 'super-admin' | 'admin' | 'manager' | 'staff';
  accessRights: {
    read: boolean;
    write: boolean;
  };
  permissions: {
    manageProducts: boolean;
    manageOrders: boolean;
    manageUsers: boolean;
    manageAdmins: boolean;
    manageSettings: boolean;
    manageCoupons: boolean;
    viewReports: boolean;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super-admin', 'admin', 'manager', 'staff'],
      default: 'staff',
    },
    accessRights: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
    },
    permissions: {
      manageProducts: { type: Boolean, default: false },
      manageOrders: { type: Boolean, default: false },
      manageUsers: { type: Boolean, default: false },
      manageAdmins: { type: Boolean, default: false },
      manageSettings: { type: Boolean, default: false },
      manageCoupons: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);