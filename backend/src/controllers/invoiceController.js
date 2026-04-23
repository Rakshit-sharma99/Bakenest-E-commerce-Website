import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

// ── Helper ─────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ══════════════════════════════════════════════════════════════════════════
// getInvoice — User: fetch their own order's invoice
// GET /api/invoice/:orderId
// ══════════════════════════════════════════════════════════════════════════
export const getInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!isValidId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format.' });
    }

    // Fetch order and verify ownership
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Security: only the order owner can access their invoice
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This is not your order.' });
    }

    // Fetch (or lazily create) the invoice document
    let invoice = await Invoice.findOne({ orderId });
    if (!invoice) {
      // Backfill: create invoice if it doesn't exist yet (legacy orders)
      invoice = await Invoice.create({ orderId });
    }

    return res.json(buildInvoicePayload(invoice, order, order.user));
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// getInvoiceAdmin — Admin: fetch any order's invoice
// GET /api/invoice/admin/:orderId
// ══════════════════════════════════════════════════════════════════════════
export const getInvoiceAdmin = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!isValidId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format.' });
    }

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    let invoice = await Invoice.findOne({ orderId });
    if (!invoice) {
      invoice = await Invoice.create({ orderId });
    }

    return res.json(buildInvoicePayload(invoice, order, order.user));
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// Helper: shape the response payload
// ══════════════════════════════════════════════════════════════════════════
function buildInvoicePayload(invoice, order, user) {
  return {
    invoice: {
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
    },
    order: {
      _id: order._id,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      couponCode: order.couponCode,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    },
    user: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    company: {
      name: 'BakeNest',
      tagline: 'Your Premium Baking Partner',
      address: '123, Baker Street, Connaught Place, New Delhi – 110001, India',
      email: 'support@bakenest.in',
      phone: '+91 98765 43210',
      gstin: 'GSTIN: 07AABCU9603R1ZX', // placeholder
      website: 'www.bakenest.in',
    },
  };
}
