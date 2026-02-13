import { Request, Response } from 'express';
import Coupon from '../../db/models/Coupon';
import { AuthRequest } from '../middleware/auth';

// Get all coupons
export const getAllCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder;

    const coupons = await Coupon.find(filter)
      .sort(sortObj)
      .populate('createdBy', 'username email')
      .populate('applicableProducts', 'name price')
      .populate('excludedProducts', 'name price');

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get single coupon by code
export const getCouponByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
      .populate('createdBy', 'username email')
      .populate('applicableProducts', 'name price')
      .populate('excludedProducts', 'name price');

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Validate coupon for order
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderValue, userId, category, productIds } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      res.status(404).json({ message: 'Invalid coupon code', valid: false });
      return;
    }

    const now = new Date();
    
    // Check validity dates
    if (now < coupon.validFrom || now > coupon.validUntil) {
      res.status(400).json({ message: 'Coupon has expired or not yet valid', valid: false });
      return;
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ message: 'Coupon usage limit reached', valid: false });
      return;
    }

    // Check minimum order value
    if (orderValue < coupon.minOrderValue) {
      res.status(400).json({
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
        valid: false,
      });
      return;
    }

    // Check category restrictions
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      if (!category || !coupon.applicableCategories.includes(category)) {
        res.status(400).json({
          message: 'Coupon not applicable for this category',
          valid: false,
        });
        return;
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.status(200).json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalAmount: orderValue - discountAmount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create new coupon
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const couponData = {
      ...req.body,
      code: req.body.code.toUpperCase(),
      validFrom: req.body.validFrom || new Date(),
      createdBy: req.admin?._id,
    };

    const coupon = await Coupon.create(couponData);
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Coupon code already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

// Update coupon
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const coupon = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete coupon
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOneAndDelete({ code: code.toUpperCase() });

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Toggle coupon active status
export const toggleCouponStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      coupon,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get coupon statistics
export const getCouponStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const expiredCoupons = await Coupon.countDocuments({ validUntil: { $lt: new Date() } });

    const topUsedCoupons = await Coupon.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select('code description usedCount usageLimit');

    res.status(200).json({
      total: totalCoupons,
      active: activeCoupons,
      expired: expiredCoupons,
      topUsed: topUsedCoupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
