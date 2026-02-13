import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../../db/models/Admin';

export interface AuthRequest extends Request {
  admin?: any;
}

export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      res.status(401).json({ message: 'Invalid token. Admin not found.' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorizeAdmin = (requiredRight: 'read' | 'write') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!req.admin.accessRights[requiredRight]) {
      res.status(403).json({ 
        message: `Access denied. ${requiredRight} permission required.` 
      });
      return;
    }

    next();
  };
};
