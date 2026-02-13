import { Router } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  getProductsByCategory,
  getBestSellingProducts,
  searchProducts
} from '../controllers/productController';
import { validate } from '../middleware/validate';
import { 
  getProductByIdSchema,
  getProductsByCategorySchema,
  searchProductsSchema
} from '../validation/productValidation';

const router = Router();

// ======================
// PUBLIC PRODUCT ROUTES (No Authentication Required)
// ======================

// Search products with filters
router.get('/search', validate(searchProductsSchema), searchProducts);

// Get all active products
router.get('/', getAllProducts);

// Get best-selling products
router.get('/best-sellers', getBestSellingProducts);

// Get products by category
router.get('/category/:category', validate(getProductsByCategorySchema), getProductsByCategory);

// Get single product by ID
router.get('/:productId', validate(getProductByIdSchema), getProductById);

export default router;
