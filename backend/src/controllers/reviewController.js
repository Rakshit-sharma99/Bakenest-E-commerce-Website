import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { body, validationResult } from 'express-validator';

// 1. Add a Review
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a valid rating between 1 and 5' });
    }
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Review comment cannot be empty' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    next(error);
  }
};

// 2. Fetch all reviews for a product
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    // Advanced feature: sorting
    const sortBy = req.query.sort === 'highest' ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort(sortBy);

    // Advanced feature: review breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      breakdown[r.rating] += 1;
    });

    res.json({
      success: true,
      count: reviews.length,
      breakdown,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update a Review
export const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// 4. Delete a Review
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
