import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent users from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
// Per-product review listing sorted by newest (most common read pattern)
reviewSchema.index({ product: 1, createdAt: -1 });
// Sort reviews by rating for "Most Helpful" sort
reviewSchema.index({ product: 1, rating: -1 });


// Static method to calculate and update average ratings
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const result = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    if (result.length > 0) {
      // Update actual product
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: Math.round(result[0].averageRating * 10) / 10,
        reviewsCount: result[0].totalReviews,
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: 0,
        reviewsCount: 0,
      });
    }
  } catch (error) {
    console.error('Error updating average rating:', error);
  }
};

// Call calcAverageRatings after saving or deleting a review
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  this.constructor.calcAverageRatings(this.product);
});

export default mongoose.model('Review', reviewSchema);
