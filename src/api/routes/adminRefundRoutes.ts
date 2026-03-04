import { Router } from 'express';
import {
  approveRefundRequest,
  createAdminRefundRequest,
  getAllRefunds,
} from '../controllers/refundController';
import { validate } from '../middleware/validate';
import { authenticateAdmin, authorizeAdmin } from '../middleware/auth';
import {
  approveRefundSchema,
  createAdminRefundSchema,
} from '../validation/refundValidation';

const router = Router();

// List all refunds (admin)
router.get('/', authenticateAdmin, authorizeAdmin('read'), getAllRefunds);

// Issue a refund directly for a custom/partial amount (admin)
router.post(
  '/',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(createAdminRefundSchema),
  createAdminRefundRequest
);

// Approve an existing (customer) refund request and submit it to Razorpay (admin)
router.post(
  '/:refundId/approve',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(approveRefundSchema),
  approveRefundRequest
);

export default router;
