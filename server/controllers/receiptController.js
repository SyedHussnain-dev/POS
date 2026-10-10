import Receipt from '../models/Receipt.js';
import Item from '../models/Item.js';

// ── Get all receipts ──
export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .sort({ createdAt: -1 });
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single receipt ──
export const getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('items.item');
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, data: receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Create receipt ──
export const createReceipt = async (req, res) => {
  try {
    const receiptNumber = `RCP-${Date.now()}`;
    const receiptData = { ...req.body, receiptNumber };

    const receipt = await Receipt.create(receiptData);

    // Decrement stock for each item
    for (const entry of receipt.items) {
      if (entry.item) {
        await Item.findByIdAndUpdate(entry.item, {
          $inc: { stock: -entry.qty },
        });
      }
    }

    // Customer totalSpent logic removed

    res.status(201).json({ success: true, data: receipt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Dashboard stats ──
export const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayReceipts = await Receipt.find({
      createdAt: { $gte: todayStart },
    });
    const todaySales = todayReceipts.reduce((sum, r) => sum + r.grandTotal, 0);

    const [totalItems, totalReceipts, recentReceipts] =
      await Promise.all([
        Item.countDocuments(),
        Receipt.countDocuments(),
        Receipt.find()
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    res.json({
      success: true,
      data: {
        todaySales,
        totalItems,
        totalReceipts,
        recentReceipts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
