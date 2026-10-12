import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    openingTime: { type: Date, default: Date.now },
    closingTime: { type: Date },
    openingFloat: { type: Number, required: true, min: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number, default: 0 },
    cashDifference: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  },
  { timestamps: true }
);

export default mongoose.model('Shift', shiftSchema);
