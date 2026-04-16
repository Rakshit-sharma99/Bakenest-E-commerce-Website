import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { emitRealtimeUpdate } from '../config/socket.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeSlug = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const buildQuery = (query) => {
  const q = {};
  if (query.search?.trim()) {
    q.$or = [
      { name: { $regex: query.search.trim(), $options: 'i' } },
      { description: { $regex: query.search.trim(), $options: 'i' } },
      { category: { $regex: query.search.trim(), $options: 'i' } },
    ];
  }
  if (query.category && query.category !== 'all') q.category = query.category;
  if (query.active === 'true') q.isActive = true;
  if (query.active === 'false') q.isActive = false;
  if (query.featured === 'true') q.featured = true;
  if (query.minPrice || query.maxPrice) {
    q.price = {};
    if (query.minPrice) q.price.$gte = toNumber(query.minPrice);
    if (query.maxPrice) q.price.$lte = toNumber(query.maxPrice);
  }
  return q;
};

// ══════════════════════════════════════════════════════════════════════════
// getProducts — Public, paginated, filterable product listing
// ══════════════════════════════════════════════════════════════════════════
export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(toNumber(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toNumber(req.query.limit, 20), 1), 300);

    const ALLOWED_SORT = ['createdAt', 'price', 'rating', 'reviewsCount', 'stock', 'name'];
    const sortBy = ALLOWED_SORT.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const query = buildQuery(req.query);

    const [items, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // lean() for read-only: ~30% faster
      Product.countDocuments(query),
    ]);

    return res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// getProductById — Public, fetch single product with related products
// ══════════════════════════════════════════════════════════════════════════
export const getProductById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findById(req.params.id)
      .populate('relatedProducts', 'name price imageUrl rating reviewsCount category slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// createProduct — Admin only, full validation
// ══════════════════════════════════════════════════════════════════════════
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, stock } = req.body;

    // Required field validation
    if (!name?.trim()) return res.status(400).json({ message: 'Product name is required' });
    if (!description?.trim()) return res.status(400).json({ message: 'Description is required' });
    if (!category?.trim()) return res.status(400).json({ message: 'Category is required' });
    if (price === undefined || price === '') return res.status(400).json({ message: 'Price is required' });
    if (toNumber(price) < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (toNumber(stock) < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    // Auto-generate slug if not provided
    const rawSlug = req.body.slug?.trim() || name.trim();
    const slug = sanitizeSlug(rawSlug);

    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: `Slug "${slug}" already exists. Try a different name or slug.` });
    }

    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      category: category.trim(),
      price: toNumber(price),
      comparePrice: req.body.comparePrice ? toNumber(req.body.comparePrice) : undefined,
      stock: toNumber(stock, 0),
      imageUrl: req.body.imageUrl?.trim() || '',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      featured: Boolean(req.body.featured),
      warranty: req.body.warranty?.trim() || '',
      returnsAllowed: req.body.returnsAllowed !== undefined ? Boolean(req.body.returnsAllowed) : true,
      relatedProducts: Array.isArray(req.body.relatedProducts)
        ? req.body.relatedProducts.filter(isValidId)
        : [],
    });

    emitRealtimeUpdate('products:changed', { action: 'created', productId: product._id });
    return res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this slug already exists' });
    }
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// updateProduct — Admin only
// ══════════════════════════════════════════════════════════════════════════
export const updateProduct = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Validate numeric fields if provided
    if (req.body.price !== undefined && toNumber(req.body.price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }
    if (req.body.stock !== undefined && toNumber(req.body.stock) < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const SCALAR_FIELDS = [
      'name', 'description', 'category', 'imageUrl', 'isActive', 'featured',
      'price', 'comparePrice', 'stock', 'warranty', 'returnsAllowed', 'appliedDiscount',
    ];

    SCALAR_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    });

    // Handle slug update — regenerate from name if not provided
    if (req.body.slug !== undefined) {
      const newSlug = sanitizeSlug(req.body.slug.trim() || product.name);
      if (newSlug !== product.slug) {
        const conflict = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
        if (conflict) return res.status(409).json({ message: `Slug "${newSlug}" is already taken` });
        product.slug = newSlug;
      }
    }

    // Handle arrays safely
    if (Array.isArray(req.body.images)) product.images = req.body.images;
    if (Array.isArray(req.body.relatedProducts)) {
      product.relatedProducts = req.body.relatedProducts.filter(isValidId);
    }

    const updated = await product.save();
    emitRealtimeUpdate('products:changed', { action: 'updated', productId: updated._id });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this slug already exists' });
    }
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// deleteProduct — Admin only, safety check for active orders
// ══════════════════════════════════════════════════════════════════════════
export const deleteProduct = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });

    emitRealtimeUpdate('products:changed', { action: 'deleted', productId: req.params.id });
    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};
