import express from 'express';
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  toggleCouponStatus,
  updateCoupon,
  validateCoupon,
} from '../controllers/couponController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// ── Public route: validate a coupon against a cart (used at checkout) ──────
// Must be declared BEFORE the protect+adminOnly middleware block
router.post('/validate', validateCoupon);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.use(protect, adminOnly);
router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);

export default router;
