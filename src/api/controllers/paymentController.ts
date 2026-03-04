import { Request, Response } from 'express';
import Payment from '../../db/models/Payment';

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
     
export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findById(req.params.id )
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount');
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPaymentsByOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ orderId: req.params.orderId })
      .populate('userId', 'name email');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.status(200).json({ message: 'Payment status updated successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
