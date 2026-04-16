import express from 'express';
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  toggleCouponStatus,
  updateCoupon,
} from '../controllers/couponController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);

export default router;
