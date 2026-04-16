import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ['all', 'category', 'product'], default: 'all' },
    targetCategory: { type: String, default: '' },
    targetProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    minOrderAmount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
