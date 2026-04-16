import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, adminOnly, getOrders);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
