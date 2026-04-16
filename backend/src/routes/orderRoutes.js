import express from 'express';
import { createOrder, getMyOrders, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// ── Authenticated user routes ────────────────────────────────────────────────
router.post('/', protect, createOrder);         // Place a new order
router.get('/my', protect, getMyOrders);        // My order history

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', protect, adminOnly, getOrders);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
