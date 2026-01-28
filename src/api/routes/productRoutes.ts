import { Router } from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getBestSellingProducts,
  searchProducts
} from '../controllers/productController';
import { validate } from '../middleware/validate';
import { 
  createProductSchema, 
  updateProductSchema, 
  getProductByIdSchema,
  getProductsByCategorySchema,
  searchProductsSchema
} from '../validation/productValidation';

const router = Router();

router.post('/', validate(createProductSchema), createProduct);
router.get('/search', validate(searchProductsSchema), searchProducts);
router.get('/', getAllProducts);
router.get('/best-sellers', getBestSellingProducts);
router.get('/category/:category', validate(getProductsByCategorySchema), getProductsByCategory);
router.get('/:id', validate(getProductByIdSchema), getProductById);
router.put('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
