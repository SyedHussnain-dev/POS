import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Shift from '../models/Shift.js';
import { JWT_SECRET } from '../middleware/auth.js';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// ── Login with Email & Password ──
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let activeShift = null;
    if (user.activeShiftId) {
      activeShift = await Shift.findById(user.activeShiftId);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          activeShiftId: user.activeShiftId,
          activeShift,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Quick PIN Switch (Cashier Fast-Switch) ──
export const pinSwitch = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ success: false, message: 'A 4-digit PIN is required' });
    }

    const user = await User.findOne({ pin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }

    let activeShift = null;
    if (user.activeShiftId) {
      activeShift = await Shift.findById(user.activeShiftId);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          activeShiftId: user.activeShiftId,
          activeShift,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Current User Profile ──
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    let activeShift = null;
    if (user.activeShiftId) {
      activeShift = await Shift.findById(user.activeShiftId);
    }

    res.json({
      success: true,
      data: {
        user,
        activeShift,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── List All Active Staff ──
export const getStaff = async (_req, res) => {
  try {
    const staff = await User.find().select('name email role avatarUrl activeShiftId');
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
