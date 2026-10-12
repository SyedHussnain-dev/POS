import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    taxRate: { type: Number, default: 0 },
    imageUrl: { type: String },
    model3DUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ──
productSchema.index({ category: 1 });

export default mongoose.model('Product', productSchema);
