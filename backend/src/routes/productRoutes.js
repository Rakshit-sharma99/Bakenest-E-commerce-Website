import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
  getCategoryStats,
  restoreProduct,
} from '../controllers/productController.js';
import { adminOnly, protect, isAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isAuth, getProducts);
router.get('/stats/categories', getCategoryStats);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.patch('/restore/:id', protect, adminOnly, restoreProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
