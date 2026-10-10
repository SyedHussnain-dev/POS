import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'General' },
    stock: { type: Number, default: 0, min: 0 },
    barcode: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
