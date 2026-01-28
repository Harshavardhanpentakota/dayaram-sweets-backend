import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getAllUsers,
  deleteUser,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress
} from '../controllers/userController';
import { validate } from '../middleware/validate';
import { 
  registerUserSchema, 
  loginUserSchema, 
  updateUserSchema,
  addSavedAddressSchema,
  updateSavedAddressSchema,
  savedAddressParamsSchema
} from '../validation/userValidation';

const router = Router();

// Public routes
router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);

// Protected routes (add authentication middleware as needed)
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', validate(updateUserSchema), updateUserProfile);
router.get('/', getAllUsers);
router.delete('/:id', deleteUser);

// Saved addresses routes
router.get('/:userId/addresses', validate(savedAddressParamsSchema), getSavedAddresses);
router.post('/:userId/addresses', validate(addSavedAddressSchema), addSavedAddress);
router.put('/:userId/addresses/:addressId', validate(updateSavedAddressSchema), updateSavedAddress);
router.delete('/:userId/addresses/:addressId', validate(savedAddressParamsSchema), deleteSavedAddress);

export default router;
