import Product from '../models/Product.js';
import { emitRealtimeUpdate } from '../config/socket.js';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};

const buildQuery = (query) => {
  const q = {};
  if (query.search) {
    q.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.category && query.category !== 'all') {
    q.category = query.category;
  }
  if (query.active === 'true') q.isActive = true;
  if (query.active === 'false') q.isActive = false;
  return q;
};

export const getProducts = async (req, res) => {
  const page = Math.max(toNumber(req.query.page, 1), 1);
  const limit = Math.min(Math.max(toNumber(req.query.limit, 20), 1), 100);
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const query = buildQuery(req.query);

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('relatedProducts');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    if (error.kind === 'ObjectId' || error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req, res) => {
  const { name, slug, description, category, price, stock, isActive, featured, rating, reviewsCount } = req.body;

  if (!name || !slug || !description || !category) {
    return res.status(400).json({ message: 'name, slug, description, and category are required' });
  }

  const existing = await Product.findOne({ slug });
  if (existing) {
    return res.status(409).json({ message: 'Slug already exists' });
  }

  const product = await Product.create({
    name,
    slug,
    description,
    category,
    price: toNumber(price, 0),
    comparePrice: req.body.comparePrice ? toNumber(req.body.comparePrice, 0) : undefined,
    stock: toNumber(stock, 0),
    imageUrl: req.body.imageUrl || '',
    images: req.body.images || [],
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    featured: Boolean(featured),
    rating: toNumber(rating, 0),
    reviewsCount: toNumber(reviewsCount, 0),
    warranty: req.body.warranty || '',
    returnsAllowed: req.body.returnsAllowed !== undefined ? Boolean(req.body.returnsAllowed) : true,
    relatedProducts: req.body.relatedProducts || [],
  });

  emitRealtimeUpdate('products:changed', { action: 'created', productId: product._id });

  return res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const updatable = [
    'name', 'slug', 'description', 'category', 'imageUrl', 'images', 'isActive', 'featured',
    'price', 'comparePrice', 'stock', 'rating', 'reviewsCount', 'appliedDiscount',
    'warranty', 'returnsAllowed', 'relatedProducts'
  ];

  updatable.forEach((key) => {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  });

  const updated = await product.save();
  emitRealtimeUpdate('products:changed', { action: 'updated', productId: updated._id });

  return res.json(updated);
};

export const deleteProduct = async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Product not found' });
  }

  emitRealtimeUpdate('products:changed', { action: 'deleted', productId: req.params.id });

  return res.json({ message: 'Product deleted' });
};
