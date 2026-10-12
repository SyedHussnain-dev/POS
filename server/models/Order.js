import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['CASH', 'CARD', 'QR_CODE', 'POINTS'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    payments: [paymentSchema],
    changeGiven: { type: Number, default: 0 },
    customer: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String },
      loyaltyPointsEarned: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'REFUNDED', 'HELD'],
      default: 'COMPLETED',
    },
    holdNote: { type: String },
  },
  { timestamps: true }
);

// ── Indexes ──
orderSchema.index({ status: 1 });
orderSchema.index({ shiftId: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
