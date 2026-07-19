import { Request, Response } from 'express';
import Order from '../../db/models/Order';
import Payment from '../../db/models/Payment';
import Invoice from '../../db/models/Invoice';
import { autoRequestRefundForCancelledOrder } from '../services/refundService';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body); // Log the request body for debugging
    console.log(Order.schema.path('razorpayDetails'));
    // Generate random 8-digit invoice_id
    const invoice_id = Math.floor(Math.random() * 90000000) + 10000000;
    req.body.invoice_id = invoice_id;
    
    // Create order first to get its _id
    const order = await Order.create(req.body);
    
    // Create invoice entry with the order reference
    const invoice = await Invoice.create({
      invoice_id,
      orderId: order._id,
      userId: req.body.userId,
      invoiceNumber: `INV-${invoice_id}`,
      invoiceDate: new Date(),
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || null,
      shippingCost: req.body.shippingCost || 0,
      tax: req.body.tax || 0,
      discount: req.body.discount || 0,
      paymentStatus: req.body.paymentStatus || 'pending',
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes || '',
    });
    
    console.log('Order created:', order);
    console.log('Invoice created:', invoice);
    res.status(201).json({ 
      message: 'Order and Invoice created successfully', 
      order,
      invoice 
    });
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
    const entries = Array.isArray(req.body) ? req.body : [req.body];

    const updatedOrders = await Promise.all(
      entries.map(async (entry: { order_id: string; status: string }) => {
        const order = await Order.findByIdAndUpdate(
          entry.order_id,
          { status: entry.status },
          { new: true }
        );

        // When an online, paid order is cancelled, auto-flag it for a refund.
        if (order && entry.status === 'cancelled') {
          try {
            await autoRequestRefundForCancelledOrder(order);
          } catch (refundError) {
            console.error(
              `Failed to auto-create refund for cancelled order ${entry.order_id}:`,
              refundError
            );
          }
        }

        return {
          order_id: entry.order_id,
          order,
        };
      })
    );

    const success = updatedOrders
      .filter((result) => result.order)
      .map((result) => result.order);

    const failed = updatedOrders
      .filter((result) => !result.order)
      .map((result) => result.order_id);

    if (success.length === 0) {
      res.status(404).json({ message: 'No matching orders found', failedOrderIds: failed });
      return;
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      updatedCount: success.length,
      failedCount: failed.length,
      failedOrderIds: failed,
      orders: success,
    });
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
        weight: item.weight,
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
