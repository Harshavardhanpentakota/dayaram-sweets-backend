import { Router } from 'express';
import { getCloudinaryUploadSignature } from '../controllers/cloudinaryController';
import { authenticateAdmin, authorizeAdmin } from '../middleware/auth';

const router = Router();

// GET /api/cloudinary-signature
// Authenticated: returns a timestamped upload signature. The frontend uses it to
// upload the image directly to Cloudinary, then sends the resulting secure_url
// in the product's `images` array on create/update.
//
// Auth middleware stubs — swap/adjust as your auth strategy evolves.
router.get(
  '/',
  authenticateAdmin,
  authorizeAdmin('write'),
  getCloudinaryUploadSignature
);

export default router;
