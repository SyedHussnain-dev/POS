import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarUrl: { type: String },
    activeShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
