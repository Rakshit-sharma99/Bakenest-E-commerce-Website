// Import the Mongoose library for MongoDB object modeling
import mongoose from 'mongoose';
// Import the Product model to interact with the products collection
import Product from '../models/Product.js';
// Import the real-time update utility to broadcast changes via web sockets
import { emitRealtimeUpdate } from '../config/socket.js';

// Helper function to safely convert a value to a number, with an optional fallback
const toNumber = (value, fallback = 0) => {
  // Convert the input value to a Number type
  const n = Number(value);
  // Check if the conversion resulted in NaN; return fallback if true, otherwise return n
  return Number.isNaN(n) ? fallback : n;
};

// Helper function to validate if a string is a valid MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to sanitize a string into a URL-friendly slug
const sanitizeSlug = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Helper function to build a MongoDB query object based on request query parameters
const buildQuery = (query) => {
  // Initialize an empty query object
  const q = {};
  // If a search term is provided, build a regex-based $or query for name, description, and category
  if (query.search?.trim()) {
    q.$or = [
      { name: { $regex: query.search.trim(), $options: 'i' } },
      { description: { $regex: query.search.trim(), $options: 'i' } },
      { category: { $regex: query.search.trim(), $options: 'i' } },
    ];
  }
  // Filter by category if one is specified and it is not 'all'
  if (query.category && query.category !== 'all') q.category = query.category;
  // Filter by active status if requested (accepts 'true' as a string)
  if (query.active === 'true') q.isActive = true;
  // Filter by inactive status if requested (accepts 'false' as a string)
  if (query.active === 'false') q.isActive = false;
  // Filter by featured status if requested (accepts 'true' as a string)
  if (query.featured === 'true') q.featured = true;
  // Filter by price range if minPrice or maxPrice is provided
  if (query.minPrice || query.maxPrice) {
    // Initialize the price filter object
    q.price = {};
    // Set the minimum price filter ($gte) if provided
    if (query.minPrice) q.price.$gte = toNumber(query.minPrice);
    // Set the maximum price filter ($lte) if provided
    if (query.maxPrice) q.price.$lte = toNumber(query.maxPrice);
  }
  // Return the completed query object
  return q;
};

// Controller to fetch a paginated and filterable list of products (Public Access)
export const getProducts = async (req, res, next) => {
  try {
    // Determine the current page number, ensuring it is at least 1
    const page  = Math.max(toNumber(req.query.page, 1), 1);
    // Determine the items per page (limit), enforcing a minimum of 1 and a maximum of 100
    const limit = Math.min(Math.max(toNumber(req.query.limit, 20), 1), 100);

    // List of fields that are allowed to be used for sorting
    const ALLOWED_SORT = ['createdAt', 'price', 'rating', 'reviewsCount', 'stock', 'name'];
    // Determine the sort field, defaulting to 'createdAt' if the requested field is invalid
    const sortBy = ALLOWED_SORT.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    // Determine the sort order (ascending or descending), defaulting to -1 (descending)
    const order  = req.query.order === 'asc' ? 1 : -1;

    // Use the helper to construct the query object from request parameters
    const query = buildQuery(req.query);
    // Optimization: If a search term exists and no $or query was built, use $text search instead
    if (req.query.search?.trim() && !query.$or) {
      query.$text = { $search: req.query.search.trim() };
      delete query.$or;
    }

    // Define which fields to include in the product list view to reduce data transfer
    const LIST_PROJECTION = {
      name: 1, slug: 1, category: 1, price: 1, comparePrice: 1,
      stock: 1, imageUrl: 1, isActive: 1, featured: 1,
      rating: 1, reviewsCount: 1, appliedDiscount: 1, createdAt: 1,
    };

    // Execute the database queries for items and total count in parallel for efficiency
    const [items, total] = await Promise.all([
      // Fetch the products matching the query with projection, sorting, and pagination
      Product.find(query, LIST_PROJECTION)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // Use .lean() to convert documents to plain JSON objects for better performance
      // Count the total number of documents matching the query (for pagination metadata)
      Product.countDocuments(query),
    ]);

    // Return the items, total count, current page, and calculated total pages as JSON
    return res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    // Forward any caught errors to the error handling middleware
    next(err);
  }
};

// Controller to fetch a single product by its unique ID (Public Access)
export const getProductById = async (req, res, next) => {
  try {
    // Validate the product ID format; return 404 if invalid
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch the product by ID and populate essential fields for related products
    const product = await Product.findById(req.params.id)
      .populate('relatedProducts', 'name price imageUrl rating reviewsCount category slug');

    // Return 404 if the product does not exist in the database
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Return the full product details as JSON
    return res.json(product);
  } catch (err) {
    // Forward any caught errors to the error handling middleware
    next(err);
  }
};

// Controller to create a new product (Admin Only)
export const createProduct = async (req, res, next) => {
  try {
    // Extract primary product fields from the request body
    const { name, description, category, price, stock } = req.body;

    // Validate that the product name is provided and not empty
    if (!name?.trim()) return res.status(400).json({ message: 'Product name is required' });
    // Validate that the product description is provided and not empty
    if (!description?.trim()) return res.status(400).json({ message: 'Description is required' });
    // Validate that the product category is provided and not empty
    if (!category?.trim()) return res.status(400).json({ message: 'Category is required' });
    // Validate that the price is explicitly provided
    if (price === undefined || price === '') return res.status(400).json({ message: 'Price is required' });
    // Prevent negative prices for products
    if (toNumber(price) < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    // Prevent negative stock levels for products
    if (toNumber(stock) < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    // Determine the raw slug (use provided slug or fallback to the product name)
    const rawSlug = req.body.slug?.trim() || name.trim();
    // Sanitize the raw slug to ensure it is URL-friendly
    const slug = sanitizeSlug(rawSlug);

    // Check if a product with the same slug already exists to prevent duplicates
    const existing = await Product.findOne({ slug });
    // Return a conflict error if the slug is already in use
    if (existing) {
      return res.status(409).json({ message: `Slug "${slug}" already exists. Try a different name or slug.` });
    }

    // Create the new product in the database using sanitized data
    const product = await Product.create({
      name: name.trim(), // Trim leading/trailing whitespace from the name
      slug, // Use the sanitized slug
      description: description.trim(), // Trim leading/trailing whitespace from the description
      category: category.trim(), // Trim leading/trailing whitespace from the category
      price: toNumber(price), // Ensure the price is stored as a number
      comparePrice: req.body.comparePrice ? toNumber(req.body.comparePrice) : undefined, // Optional comparison price
      stock: toNumber(stock, 0), // Ensure the stock is stored as a number, defaulting to 0
      imageUrl: req.body.imageUrl?.trim() || '', // Store the primary image URL
      images: Array.isArray(req.body.images) ? req.body.images : [], // Ensure additional images are stored as an array
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true, // Default to active if not specified
      featured: Boolean(req.body.featured), // Convert featured status to a boolean
      warranty: req.body.warranty?.trim() || '', // Store optional warranty information
      returnsAllowed: req.body.returnsAllowed !== undefined ? Boolean(req.body.returnsAllowed) : true, // Default to allowed
      relatedProducts: Array.isArray(req.body.relatedProducts)
        ? req.body.relatedProducts.filter(isValidId) // Filter for valid ObjectIds in the related products array
        : [],
    });

    // Broadcast a real-time event indicating that a new product has been created
    emitRealtimeUpdate('products:changed', { action: 'created', productId: product._id });
    // Return the newly created product with a 201 Created status code
    return res.status(201).json(product);
  } catch (err) {
    // Handle MongoDB duplicate key errors (error code 11000) specifically
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this slug already exists' });
    }
    // Forward all other errors to the global error handler
    next(err);
  }
};

// Controller to update an existing product by its ID (Admin Only)
export const updateProduct = async (req, res, next) => {
  try {
    // Validate the product ID format; return 400 if invalid
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Attempt to find the product in the database by its ID
    const product = await Product.findById(req.params.id);
    // Return 404 NOT FOUND if the product does not exist
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Validate that the price is not negative if an update is being requested
    if (req.body.price !== undefined && toNumber(req.body.price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }
    // Validate that the stock level is not negative if an update is being requested
    if (req.body.stock !== undefined && toNumber(req.body.stock) < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    // List of scalar fields that can be updated directly from the request body
    const SCALAR_FIELDS = [
      'name', 'description', 'category', 'imageUrl', 'isActive', 'featured',
      'price', 'comparePrice', 'stock', 'warranty', 'returnsAllowed', 'appliedDiscount',
    ];

    // Iterate through the scalar fields and update the product document if values are provided
    SCALAR_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    });

    // Handle updates to the product slug specifically
    if (req.body.slug !== undefined) {
      // Regenerate slug from text or fallback to the current product name
      const newSlug = sanitizeSlug(req.body.slug.trim() || product.name);
      // If the slug has changed, ensure it is unique across all products
      if (newSlug !== product.slug) {
        // Search for other products (excluding the current one) that use the new slug
        const conflict = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
        // Error if a conflict is found
        if (conflict) return res.status(409).json({ message: `Slug "${newSlug}" is already taken` });
        // Update the slug if unique
        product.slug = newSlug;
      }
    }

    // Update images array securely if provided in the body
    if (Array.isArray(req.body.images)) product.images = req.body.images;
    // Update related products array specifically, ensuring only valid IDs are included
    if (Array.isArray(req.body.relatedProducts)) {
      product.relatedProducts = req.body.relatedProducts.filter(isValidId);
    }

    // Persist the changes to the database
    const updated = await product.save();
    // Broadcast a real-time event indicating that a product has been updated
    emitRealtimeUpdate('products:changed', { action: 'updated', productId: updated._id });
    // Return the updated product document as JSON
    return res.json(updated);
  } catch (err) {
    // Handle specific MongoDB error code for duplicate slugs
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this slug already exists' });
    }
    // Forward remaining errors to the middleware chain
    next(err);
  }
};

// Controller to delete a product by its ID (Admin Only)
export const deleteProduct = async (req, res, next) => {
  try {
    // Validate the product ID format; return 400 if invalid
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Attempt to locate and remove the product from the database
    const deleted = await Product.findByIdAndDelete(req.params.id);
    // Return 404 NOT FOUND if the product was already missing
    if (!deleted) return res.status(404).json({ message: 'Product not found' });

    // Broadcast a real-time event indicating that a product has been deleted
    emitRealtimeUpdate('products:changed', { action: 'deleted', productId: req.params.id });
    // Return a success message as JSON
    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    // Forward any errors to the error handling middleware
    next(err);
  }
};
// Controller to fetch product counts grouped by category (Public Access)
export const getCategoryStats = async (req, res, next) => {
  try {
    // Aggregate products to count active items per category
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Format the response into a simpler key-value object { categoryId: count }
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return res.json(formattedStats);
  } catch (err) {
    next(err);
  }
};
