import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    warranty: { type: String, default: '' },
    returnsAllowed: { type: Boolean, default: true },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewsCount: { type: Number, min: 0, default: 0 },
    appliedDiscount: {
      type: {
        type: String,
        enum: ['none', 'percentage', 'flat'],
        default: 'none',
      },
      value: { type: Number, default: 0 },
      label: { type: String, default: '' },
      active: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// ── Performance Indexes ───────────────────────────────────────────────────
// Compound: category filter + price sort + rating sort (most common query shape)
productSchema.index({ category: 1, price: 1, rating: -1 });
// Compound: active listing sorted by newest
productSchema.index({ isActive: 1, createdAt: -1 });
// Compound: featured products sorted by rating
productSchema.index({ featured: 1, rating: -1 });
// Full-text search (name weighted 10x, description 5x)
productSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 }, name: 'product_text_search' });

export default mongoose.model('Product', productSchema);
