import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { emitRealtimeUpdate } from '../config/socket.js';

// ── Public: Validate a coupon code against a cart ─────────────────────────
export const validateCoupon = async (req, res) => {
  const { code, subtotal, cartCategories = [] } = req.body;

  if (!code || !subtotal) {
    return res.status(400).json({ message: 'Coupon code and cart subtotal are required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return res.status(404).json({ message: 'Invalid coupon code' });
  }
  if (!coupon.active) {
    return res.status(400).json({ message: 'This coupon is no longer active' });
  }

  // Check validity dates
  const now = new Date();
  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    return res.status(400).json({ message: 'This coupon is not yet valid' });
  }
  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    return res.status(400).json({ message: 'This coupon has expired' });
  }

  // Check minimum order
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      message: `Minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`,
    });
  }

  // Check category restriction
  if (coupon.appliesTo === 'category' && coupon.targetCategory) {
    const categoryMatch = cartCategories.includes(coupon.targetCategory);
    if (!categoryMatch) {
      return res.status(400).json({
        message: `This coupon applies only to the "${coupon.targetCategory}" category`,
      });
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'flat') {
    discountAmount = Math.min(coupon.discountValue, subtotal); // Can't discount more than total
  }

  return res.json({
    valid: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discountAmount,
  });
};


export const getCoupons = async (req, res) => {
  const search = req.query.search || '';
  const query = search
    ? { code: { $regex: search.toUpperCase(), $options: 'i' } }
    : {};

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });
  return res.json(coupons);
};

const syncCouponToProducts = async (coupon) => {
  const discountState = {
    type: coupon.discountType,
    value: coupon.discountValue,
    label: coupon.code,
    active: coupon.active,
  };

  if (coupon.appliesTo === 'product' && coupon.targetProducts?.length) {
    await Product.updateMany(
      { _id: { $in: coupon.targetProducts } },
      { appliedDiscount: discountState }
    );
    emitRealtimeUpdate('products:changed', { action: 'discount-sync' });
  }

  if (coupon.appliesTo === 'category' && coupon.targetCategory) {
    await Product.updateMany(
      { category: coupon.targetCategory },
      { appliedDiscount: discountState }
    );
    emitRealtimeUpdate('products:changed', { action: 'discount-sync' });
  }
};

export const createCoupon = async (req, res) => {
  const payload = { ...req.body, code: req.body.code?.toUpperCase() };
  const coupon = await Coupon.create(payload);
  await syncCouponToProducts(coupon);
  emitRealtimeUpdate('coupons:changed', { action: 'created', couponId: coupon._id });
  return res.status(201).json(coupon);
};

export const updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

  await syncCouponToProducts(coupon);
  emitRealtimeUpdate('coupons:changed', { action: 'updated', couponId: coupon._id });
  return res.json(coupon);
};

export const toggleCouponStatus = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

  coupon.active = !coupon.active;
  await coupon.save();

  await syncCouponToProducts(coupon);
  emitRealtimeUpdate('coupons:changed', { action: 'toggled', couponId: coupon._id, active: coupon.active });

  return res.json(coupon);
};

export const deleteCoupon = async (req, res) => {
  const removed = await Coupon.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ message: 'Coupon not found' });

  emitRealtimeUpdate('coupons:changed', { action: 'deleted', couponId: req.params.id });
  return res.json({ message: 'Coupon deleted' });
};
