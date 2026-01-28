import { Router } from 'express';
import { 
  createOrder, 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus,
  getUserOrders,
  deleteOrder,
  generateInvoice
} from '../controllers/orderController';
import { validate } from '../middleware/validate';
import { 
  createOrderSchema, 
  updateOrderStatusSchema, 
  getOrderByIdSchema,
  getUserOrdersSchema
} from '../validation/orderValidation';

const router = Router();

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getAllOrders);
router.get('/user/:userId', validate(getUserOrdersSchema), getUserOrders);
router.get('/:id', validate(getOrderByIdSchema), getOrderById);
router.get('/:id/invoice', validate(getOrderByIdSchema), generateInvoice);
router.put('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;
