import { Router } from 'express';
import { 
  createPayment, 
  getAllPayments, 
  getPaymentById, 
  updatePaymentStatus,
  getPaymentsByOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
} from '../controllers/paymentController';
import { validate } from '../middleware/validate';
import { verifyRazorpayWebhook } from '../middleware/verifyRazorpayWebhook';
import { authenticateAdmin } from '../middleware/auth';
import { 
  createPaymentSchema, 
  updatePaymentStatusSchema, 
  getPaymentByIdSchema,
  getPaymentsByOrderSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from '../validation/paymentValidation';

const router = Router();

router.post('/create-order', validate(createRazorpayOrderSchema), createRazorpayOrder);
router.post('/verify-payment', validate(verifyRazorpayPaymentSchema), verifyRazorpayPayment);
router.post('/webhook', verifyRazorpayWebhook, handleRazorpayWebhook);

router.post('/', validate(createPaymentSchema), createPayment);
router.get('/', authenticateAdmin, getAllPayments);
router.get('/order/:orderId', validate(getPaymentsByOrderSchema), getPaymentsByOrder);
router.get('/:id', validate(getPaymentByIdSchema), getPaymentById);
router.put('/:id/status', validate(updatePaymentStatusSchema), updatePaymentStatus);

export default router;
