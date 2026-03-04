import { Router } from 'express';
import {
  createRefundRequest,
  getRefundById,
} from '../controllers/refundController';
import { validate } from '../middleware/validate';
import {
  requestRefundSchema,
  getRefundByIdSchema,
} from '../validation/refundValidation';

const router = Router();

// User requests a refund for an order
router.post('/request', validate(requestRefundSchema), createRefundRequest);

// Fetch a single refund by id
router.get('/:refundId', validate(getRefundByIdSchema), getRefundById);

export default router;
