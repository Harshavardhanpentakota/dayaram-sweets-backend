import { Request, Response } from 'express';
import Order from '../../db/models/Order';
import Payment from '../../db/models/Payment';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price');
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('items.productId', 'name price');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const generateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone savedAddresses')
      .populate('items.productId', 'name price category');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const payment = await Payment.findOne({ orderId: order._id });

    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate: new Date(),
      orderDetails: {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        status: order.status,
      },
      customer: {
        name: (order.userId as any).name,
        email: (order.userId as any).email,
        phone: (order.userId as any).phone,
        savedAddresses: (order.userId as any).savedAddresses,
      },
      billingAddress: order.billingAddress || order.shippingAddress,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        productName: item.name,
        category: (item.productId as any)?.category || 'N/A',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal,
      })),
      pricing: {
        subtotal: order.items.reduce((sum, item) => sum + item.subtotal, 0),
        shippingCost: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        totalAmount: order.totalAmount,
      },
      payment: payment ? {
        transactionId: payment.transactionId,
        method: payment.paymentMethod,
        status: payment.status,
        paidDate: payment.paymentDate,
      } : {
        method: order.paymentMethod,
        status: order.paymentStatus,
      },
      notes: order.notes,
      company: {
        name: 'Dayaram Sweets',
        address: 'Your Company Address',
        phone: 'Your Company Phone',
        email: 'contact@dayaramsweets.com',
        website: 'www.dayaramsweets.com',
      },
    };

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
