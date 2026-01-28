import { Router } from 'express';
import { 
  createPayment, 
  getAllPayments, 
  getPaymentById, 
  updatePaymentStatus,
  getPaymentsByOrder
} from '../controllers/paymentController';
import { validate } from '../middleware/validate';
import { 
  createPaymentSchema, 
  updatePaymentStatusSchema, 
  getPaymentByIdSchema,
  getPaymentsByOrderSchema
} from '../validation/paymentValidation';

const router = Router();

router.post('/', validate(createPaymentSchema), createPayment);
router.get('/', getAllPayments);
router.get('/order/:orderId', validate(getPaymentsByOrderSchema), getPaymentsByOrder);
router.get('/:id', validate(getPaymentByIdSchema), getPaymentById);
router.put('/:id/status', validate(updatePaymentStatusSchema), updatePaymentStatus);

export default router;
