import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    pin: { type: String, required: true, minlength: 4, maxlength: 72 },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'STORE_MANAGER', 'CASHIER', 'INVENTORY_SPECIALIST'],
      default: 'CASHIER',
    },
    avatarUrl: { type: String },
    activeShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  },
  { timestamps: true }
);

// ── Password Comparison ──
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── PIN Comparison ──
userSchema.methods.comparePin = async function (enteredPin) {
  if (this.pin.startsWith('$2')) return bcrypt.compare(enteredPin, this.pin);
  return this.pin === enteredPin;
};

export default mongoose.model('User', userSchema);
