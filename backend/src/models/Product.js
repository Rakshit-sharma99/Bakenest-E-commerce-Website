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

export default mongoose.model('Product', productSchema);
