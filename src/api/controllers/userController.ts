import { Request, Response } from 'express';
import User from '../../db/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, savedAddresses } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      savedAddresses
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {     
  try {
    const { email, phone, password } = req.body;

    // Check if either email or phone is provided
    if (!email && !phone) {
      res.status(400).json({ message: 'Either email or phone number is required' });
      return;
    }

    // Find user by email or phone
    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query);
    
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, savedAddresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, savedAddresses },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get user's saved addresses
export const getSavedAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId).select('savedAddresses');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user.savedAddresses || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a new saved address
export const addSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // If this address is set as default, unset all other default addresses
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.savedAddresses.push({
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false
    });

    await user.save();
    res.status(201).json({ message: 'Address added successfully', savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a saved address
export const updateSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, addressId } = req.params;
    const { street, city, state, zipCode, country, isDefault } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const addressIndex = user.savedAddresses.findIndex(
      (addr: any) => addr._id?.toString() === addressId
    );
    
    if (addressIndex === -1) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    // If this address is set as default, unset all other default addresses
    if (isDefault) {
      user.savedAddresses.forEach((addr: any) => {
        if (addr._id?.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update address fields
    const address = user.savedAddresses[addressIndex];
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();
    res.status(200).json({ message: 'Address updated successfully', savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a saved address
export const deleteSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, addressId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const addressIndex = user.savedAddresses.findIndex(
      (addr: any) => addr._id?.toString() === addressId
    );
    
    if (addressIndex === -1) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    user.savedAddresses.splice(addressIndex, 1);
    await user.save();
    res.status(200).json({ message: 'Address deleted successfully', savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
