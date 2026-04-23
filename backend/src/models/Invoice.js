import mongoose from 'mongoose';

/**
 * Generates a unique invoice number in the format: INV-YYYYMMDD-XXXXX
 * e.g.  INV-20260417-00842
 */
function generateInvoiceNumber() {
  const now = new Date();
  const datePart = now
    .toISOString()
    .slice(0, 10)   // "2026-04-17"
    .replace(/-/g, ''); // "20260417"
  const rand = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `INV-${datePart}-${rand}`;
}

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // one invoice per order
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateInvoiceNumber,
    },
  },
  { timestamps: true }
);

// If a duplicate invoiceNumber is hit on a rare collision, regenerate once
invoiceSchema.pre('save', async function regenerateOnCollision(next) {
  // Only relevant on first save
  const exists = await mongoose.model('Invoice').findOne({ invoiceNumber: this.invoiceNumber });
  if (exists && exists._id.toString() !== this._id.toString()) {
    this.invoiceNumber = generateInvoiceNumber();
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
