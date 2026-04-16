import Order from '../models/Order.js';
import { emitRealtimeUpdate } from '../config/socket.js';

export const getOrders = async (req, res) => {
  const { status, search = '' } = req.query;
  const query = {};

  if (status && status !== 'all') query.status = status;

  if (search) {
    query.$or = [
      { paymentMethod: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  return res.json(orders);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(orders);
};

export const createOrder = async (req, res) => {
  const payload = { ...req.body, user: req.user._id };
  const order = await Order.create(payload);

  emitRealtimeUpdate('orders:changed', { action: 'created', orderId: order._id });
  return res.status(201).json(order);
};

export const updateOrderStatus = async (req, res) => {
  const { status, adminNotes } = req.body;

  const allowedStatus = ['accepted', 'rejected', 'processing', 'shipped', 'delivered'];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;
  await order.save();

  emitRealtimeUpdate('orders:changed', { action: 'status-updated', orderId: order._id, status });

  return res.json(order);
};
