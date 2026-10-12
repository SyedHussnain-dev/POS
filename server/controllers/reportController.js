import Order from '../models/Order.js';
import Shift from '../models/Shift.js';

export const getSalesReport = async (req, res) => {
  try {
    const filter = { status: 'COMPLETED' };
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const payments = {};
    let grossSales = 0;
    let taxCollected = 0;
    let discounts = 0;
    for (const order of orders) {
      grossSales += Number(order.grandTotal || 0);
      taxCollected += Number(order.taxTotal || 0);
      discounts += Number(order.discountTotal || 0);
      for (const payment of order.payments || []) {
        payments[payment.method] = Number(((payments[payment.method] || 0) + Number(payment.amount || 0)).toFixed(2));
      }
    }
    res.json({ success: true, data: { orderCount: orders.length, grossSales: Number(grossSales.toFixed(2)), taxCollected: Number(taxCollected.toFixed(2)), discounts: Number(discounts.toFixed(2)), payments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getZReports = async (_req, res) => {
  try {
    const shifts = await Shift.find({ status: 'CLOSED' }).populate('cashierId', 'name email role').sort({ closingTime: -1 }).limit(50);
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
