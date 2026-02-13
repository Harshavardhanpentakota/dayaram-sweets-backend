import Admin from '../../db/models/Admin';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Admin Login
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        accessRights: admin.accessRights,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error });
  }
};

// Get all admins
export const getAllAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, role } = req.query;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (role) filter.role = role;

    const admins = await Admin.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error });
  }
};

// Get single admin
export const getAdminById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findById(adminId).select('-password');

    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin', error });
  }
};

// Add a new admin with access rights
export const addNewAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, accessRights, permissions } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      res.status(400).json({ message: 'Admin with this email or username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = new Admin({ 
      username, 
      email, 
      password: hashedPassword,
      role: role || 'staff',
      accessRights: accessRights || { read: false, write: false },
      permissions: permissions || {},
    });
    await admin.save();
    
    res.status(201).json({ 
      message: 'Admin created successfully', 
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        accessRights: admin.accessRights,
        permissions: admin.permissions,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error });
  }
};

// Modify an existing admin and/or their access rights
export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { username, email, password, role, accessRights, permissions, isActive } = req.body;
    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) {
      // Hash the new password
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role) updateData.role = role;
    if (accessRights) updateData.accessRights = accessRights;
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, { new: true }).select('-password');
    if (!updatedAdmin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }
    
    res.json({ 
      message: 'Admin updated successfully', 
      admin: updatedAdmin 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin', error });
  }
};

// Delete admin
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findByIdAndDelete(adminId);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error });
  }
};

// Toggle admin active status
export const toggleAdminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.status(200).json({
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin._id,
        username: admin.username,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin status', error });
  }
};