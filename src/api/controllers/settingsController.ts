import { Request, Response } from 'express';
import Settings from '../../db/models/Settings';
import { AuthRequest } from '../middleware/auth';

// Get all settings
export const getAllSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const settings = await Settings.find(filter).sort({ category: 1, key: 1 });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get single setting by key
export const getSettingByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });

    if (!setting) {
      res.status(404).json({ message: 'Setting not found' });
      return;
    }

    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create new setting
export const createSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, type, category, description, isActive } = req.body;

    // Check if setting already exists
    const existingSetting = await Settings.findOne({ key });
    if (existingSetting) {
      res.status(400).json({ message: 'Setting with this key already exists' });
      return;
    }

    const setting = await Settings.create({
      key,
      value,
      type,
      category,
      description,
      isActive,
    });

    res.status(201).json({ message: 'Setting created successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update setting by key (property-value approach)
export const updateSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const updateData = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!setting) {
      res.status(404).json({ message: 'Setting not found' });
      return;
    }

    res.status(200).json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update multiple settings at once
export const updateMultipleSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body.settings; // Array of { key, value }

    if (!Array.isArray(updates)) {
      res.status(400).json({ message: 'Settings must be an array' });
      return;
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const update of updates) {
      try {
        const setting = await Settings.findOneAndUpdate(
          { key: update.key },
          { $set: { value: update.value } },
          { new: true, runValidators: true }
        );

        if (setting) {
          results.success.push({ key: update.key, value: setting.value });
        } else {
          results.failed.push({ key: update.key, error: 'Setting not found' });
        }
      } catch (error: any) {
        results.failed.push({ key: update.key, error: error.message });
      }
    }

    res.status(200).json({
      message: 'Settings update completed',
      summary: {
        total: updates.length,
        successful: results.success.length,
        failed: results.failed.length,
      },
      results,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete setting
export const deleteSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOneAndDelete({ key });

    if (!setting) {
      res.status(404).json({ message: 'Setting not found' });
      return;
    }

    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get delivery charges settings
export const getDeliveryCharges = async (req: Request, res: Response): Promise<void> => {
  try {
    const deliverySettings = await Settings.find({
      category: 'delivery',
      isActive: true,
    });

    res.status(200).json(deliverySettings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update or create delivery charge
export const updateDeliveryCharge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ message: 'Key and value are required' });
      return;
    }

    // Try to find and update existing setting
    let setting = await Settings.findOneAndUpdate(
      { key, category: 'delivery' },
      { 
        $set: { 
          value, 
          description: description || `Delivery charge for ${key}`,
          type: 'number',
          category: 'delivery',
          isActive: true
        } 
      },
      { new: true, runValidators: true }
    );

    // If not found, create new one
    if (!setting) {
      setting = await Settings.create({
        key,
        value,
        type: 'number',
        category: 'delivery',
        description: description || `Delivery charge for ${key}`,
        isActive: true
      });
    }

    res.status(200).json({ message: 'Delivery charge updated successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Initialize default settings
export const initializeDefaultSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const defaultSettings = [
      {
        key: 'delivery.base_charge',
        value: 50,
        type: 'number',
        category: 'delivery',
        description: 'Base delivery charge',
      },
      {
        key: 'delivery.free_above',
        value: 500,
        type: 'number',
        category: 'delivery',
        description: 'Free delivery for orders above this amount',
      },
      {
        key: 'delivery.express_charge',
        value: 100,
        type: 'number',
        category: 'delivery',
        description: 'Express delivery charge',
      },
      {
        key: 'delivery.estimated_days',
        value: 3,
        type: 'number',
        category: 'delivery',
        description: 'Estimated delivery days',
      },
      {
        key: 'tax.gst_rate',
        value: 18,
        type: 'number',
        category: 'taxes',
        description: 'GST rate in percentage',
      },
      {
        key: 'general.min_order_value',
        value: 100,
        type: 'number',
        category: 'general',
        description: 'Minimum order value',
      },
      {
        key: 'general.currency',
        value: 'INR',
        type: 'string',
        category: 'general',
        description: 'Currency code',
      },
      {
        key: 'payment.cod_enabled',
        value: true,
        type: 'boolean',
        category: 'payment',
        description: 'Cash on delivery enabled',
      },
      {
        key: 'payment.online_enabled',
        value: true,
        type: 'boolean',
        category: 'payment',
        description: 'Online payment enabled',
      },
    ];

    const created = [];
    const skipped = [];

    for (const setting of defaultSettings) {
      const existing = await Settings.findOne({ key: setting.key });
      if (!existing) {
        const newSetting = await Settings.create(setting);
        created.push(newSetting);
      } else {
        skipped.push(setting.key);
      }
    }

    res.status(200).json({
      message: 'Default settings initialized',
      created: created.length,
      skipped: skipped.length,
      details: { created, skipped },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
