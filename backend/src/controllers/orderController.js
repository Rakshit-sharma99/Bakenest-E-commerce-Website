import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { emitRealtimeUpdate } from '../config/socket.js';

// ── Helper: validate ObjectId ──────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ══════════════════════════════════════════════════════════════════════════
// getOrders — Admin: list all orders with filters + pagination
// ══════════════════════════════════════════════════════════════════════════
export const getOrders = async (req, res, next) => {
  try {
    const { status, search = '', page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;

    if (search.trim()) {
      query.$or = [
        { 'shippingAddress.fullName': { $regex: search.trim(), $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search.trim(), $options: 'i' } },
        { paymentMethod: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(Number(page), 1) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// getMyOrders — User: their own order history
// ══════════════════════════════════════════════════════════════════════════
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// createOrder — Validate stock, decrement atomically, create order
// ══════════════════════════════════════════════════════════════════════════
export const createOrder = async (req, res, next) => {
  // Use a MongoDB session for atomic multi-document updates
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, subtotal, discount, shippingFee, total, shippingAddress, paymentMethod, couponCode } = req.body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // ── Stock Check & Atomic Decrement ──────────────────────────────────
    const stockErrors = [];

    for (const item of items) {
      if (!item.product || !isValidId(item.product)) {
        stockErrors.push(`Invalid product ID: ${item.product}`);
        continue;
      }
      if (!item.quantity || item.quantity < 1) {
        stockErrors.push(`Invalid quantity for item: ${item.name}`);
        continue;
      }

      // Atomically decrement stock only if enough is available
      // $inc with a negative value only succeeds if stock >= quantity
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!updated) {
        // If no document matched, either out of stock or product not found
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          stockErrors.push(`Product "${item.name}" no longer exists`);
        } else if (!product.isActive) {
          stockErrors.push(`Product "${item.name}" is currently unavailable`);
        } else {
          stockErrors.push(
            `"${item.name}" has only ${product.stock} unit(s) left, but ${item.quantity} requested`
          );
        }
      }
    }

    if (stockErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        message: 'Stock check failed',
        errors: stockErrors,
      });
    }

    // ── Create Order ────────────────────────────────────────────────────
    const [order] = await Order.create(
      [
        {
          user: req.user._id,
          items,
          subtotal: Number(subtotal) || 0,
          discount: Number(discount) || 0,
          shippingFee: Number(shippingFee) || 0,
          total: Number(total) || 0,
          paymentMethod: paymentMethod || 'COD',
          couponCode: couponCode || '',
          shippingAddress,
          status: 'pending',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    emitRealtimeUpdate('orders:changed', { action: 'created', orderId: order._id });
    emitRealtimeUpdate('products:changed', { action: 'stock-updated' });

    return res.status(201).json(order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// updateOrderStatus — Admin: change order status
// ══════════════════════════════════════════════════════════════════════════
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const ALLOWED = ['accepted', 'rejected', 'processing', 'shipped', 'delivered'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}` });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // If rejecting a previously pending order, restore stock
    if (status === 'rejected' && order.status === 'pending') {
      const restoreBulk = order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } },
        },
      }));
      if (restoreBulk.length > 0) {
        await Product.bulkWrite(restoreBulk);
        emitRealtimeUpdate('products:changed', { action: 'stock-restored' });
      }
    }

    order.status = status;
    if (adminNotes !== undefined) order.adminNotes = adminNotes.trim();
    await order.save();

    emitRealtimeUpdate('orders:changed', { action: 'status-updated', orderId: order._id, status });
    return res.json(order);
  } catch (err) {
    next(err);
  }
};
