import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shift from '../models/Shift.js';

// ── Create Completed Order ──
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      taxTotal = 0,
      discountTotal = 0,
      grandTotal,
      payments = [],
      changeGiven = 0,
      customer,
      shiftId: customShiftId,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    if (grandTotal === undefined || grandTotal === null) {
      return res.status(400).json({ success: false, message: 'grandTotal is required' });
    }

    const cashierId = req.user?._id || req.body.cashierId;

    // Determine active shift if not explicitly provided
    let shiftId = customShiftId;
    if (!shiftId && cashierId) {
      const activeShift = await Shift.findOne({ cashierId, status: 'OPEN' });
      if (activeShift) {
        shiftId = activeShift._id;
      }
    } else if (!shiftId) {
      const anyOpenShift = await Shift.findOne({ status: 'OPEN' });
      if (anyOpenShift) shiftId = anyOpenShift._id;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    const order = await Order.create({
      orderNumber,
      cashierId,
      shiftId,
      items,
      subtotal: Number(subtotal),
      taxTotal: Number(taxTotal),
      discountTotal: Number(discountTotal),
      grandTotal: Number(grandTotal),
      payments,
      changeGiven: Number(changeGiven),
      customer: customer || { name: 'Walk-in Customer' },
      status: 'COMPLETED',
    });

    // ── Deduct inventory stock ──
    for (const line of items) {
      if (line.productId) {
        await Product.findByIdAndUpdate(line.productId, {
          $inc: { stockQuantity: -line.quantity },
        });
      }
    }

    // ── Update Shift Register Totals ──
    if (shiftId) {
      let cashAmount = 0;
      for (const p of payments) {
        if (p.method === 'CASH') {
          cashAmount += p.amount;
        }
      }
      // Deduct change given in cash
      const netCashReceived = Math.max(0, cashAmount - Number(changeGiven || 0));

      await Shift.findByIdAndUpdate(shiftId, {
        $inc: {
          totalSales: Number(grandTotal),
          totalTransactions: 1,
          expectedCash: Number(netCashReceived),
        },
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Hold Cart for Later ──
export const holdCart = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      taxTotal = 0,
      discountTotal = 0,
      grandTotal,
      customer,
      holdNote,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart has no items to hold' });
    }

    const cashierId = req.user?._id || req.body.cashierId;
    const orderNumber = `HOLD-${Date.now().toString().slice(-6)}`;

    const order = await Order.create({
      orderNumber,
      cashierId,
      items,
      subtotal: Number(subtotal),
      taxTotal: Number(taxTotal),
      discountTotal: Number(discountTotal),
      grandTotal: Number(grandTotal),
      customer: customer || { name: 'Held Customer' },
      status: 'HELD',
      holdNote: holdNote || `Held at ${new Date().toLocaleTimeString()}`,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Get All Held Carts ──
export const getHeldCarts = async (_req, res) => {
  try {
    const held = await Order.find({ status: 'HELD' }).sort({ createdAt: -1 });
    res.json({ success: true, count: held.length, data: held });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Resume or Delete Held Cart ──
export const deleteHeldCart = async (req, res) => {
  try {
    const held = await Order.findOneAndDelete({ _id: req.params.id, status: 'HELD' });
    if (!held) {
      return res.status(404).json({ success: false, message: 'Held cart not found' });
    }
    res.json({ success: true, message: 'Held cart removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Orders History ──
export const getOrders = async (req, res) => {
  try {
    const { status = 'COMPLETED', limit = 50 } = req.query;
    const filter = {};
    if (status !== 'ALL') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('cashierId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Single Order ──
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cashierId', 'name email role')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Order / Dashboard Analytics ──
export const getOrderStats = async (_req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, allCompleted] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart }, status: 'COMPLETED' }),
      Order.find({ status: 'COMPLETED' }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalRevenue = allCompleted.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalProductsSold = allCompleted.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 0), 0),
      0
    );

    // Payment breakdown
    let cashCount = 0;
    let cardCount = 0;
    let qrCount = 0;

    for (const o of allCompleted) {
      for (const p of o.payments || []) {
        if (p.method === 'CASH') cashCount++;
        else if (p.method === 'CARD') cardCount++;
        else if (p.method === 'QR_CODE') qrCount++;
      }
    }

    res.json({
      success: true,
      data: {
        todayRevenue: Number(todayRevenue.toFixed(2)),
        todayOrdersCount: todayOrders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrdersCount: allCompleted.length,
        totalProductsSold,
        paymentBreakdown: {
          cash: cashCount,
          card: cardCount,
          qr: qrCount,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
