import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shift from '../models/Shift.js';
import mongoose from 'mongoose';

// ── Create Completed Order ──
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
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

    const cashierId = req.user?._id || req.body.cashierId;
    if (!cashierId) {
      return res.status(401).json({ success: false, message: 'Authentication is required to complete a sale' });
    }

    let order;
    await session.withTransaction(async () => {
      const shiftFilter = { cashierId, status: 'OPEN' };
      if (customShiftId) shiftFilter._id = customShiftId;
      const shift = await Shift.findOne(shiftFilter).session(session);
      if (!shift) throw new Error('Open a register shift before completing a sale');

      const normalizedItems = [];
      for (const line of items) {
        if (!line.productId || !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1) {
          throw new Error('Each cart item must have a valid product and quantity');
        }
        const product = await Product.findOneAndUpdate(
          { _id: line.productId, isAvailable: true, stockQuantity: { $gte: Number(line.quantity) } },
          { $inc: { stockQuantity: -Number(line.quantity) } },
          { new: true, session }
        );
        if (!product) throw new Error(`Insufficient stock for an item in this cart`);
        const unitPrice = Number(product.sellingPrice);
        const quantity = Number(line.quantity);
        normalizedItems.push({
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice,
          subtotal: Number((unitPrice * quantity).toFixed(2)),
          taxRate: Number(product.taxRate || 0),
        });
      }

      const calculatedSubtotal = Number(normalizedItems.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
      const calculatedTax = Number(normalizedItems.reduce((sum, line) => sum + (line.subtotal * line.taxRate) / 100, 0).toFixed(2));
      const safeDiscount = Number(discountTotal || 0);
      if (safeDiscount < 0 || safeDiscount > calculatedSubtotal) throw new Error('Invalid discount amount');
      const calculatedGrandTotal = Number((calculatedSubtotal - safeDiscount + calculatedTax).toFixed(2));
      const safeChange = Number(changeGiven || 0);
      const paymentTotal = Number(payments.reduce((total, payment) => total + Number(payment.amount || 0), 0).toFixed(2));
      if (!payments.length || safeChange < 0 || Math.abs(paymentTotal - safeChange - calculatedGrandTotal) > 0.009) {
        throw new Error('Payments less change must equal the order total');
      }

      const storedItems = normalizedItems.map(({ taxRate: _taxRate, ...line }) => line);
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      [order] = await Order.create([{
        orderNumber,
        cashierId,
        shiftId: shift._id,
        items: storedItems,
        subtotal: calculatedSubtotal,
        taxTotal: calculatedTax,
        discountTotal: safeDiscount,
        grandTotal: calculatedGrandTotal,
        payments,
        changeGiven: safeChange,
        customer: customer || { name: 'Walk-in Customer' },
        status: 'COMPLETED',
      }], { session });

      const cashTendered = payments.reduce((sum, payment) => payment.method === 'CASH' ? sum + Number(payment.amount) : sum, 0);
      await Shift.findByIdAndUpdate(shift._id, {
        $inc: {
          totalSales: calculatedGrandTotal,
          totalTransactions: 1,
          expectedCash: Number((cashTendered - safeChange).toFixed(2)),
        },
      }, { session });
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    await session.endSession();
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
    if (!cashierId) {
      return res.status(401).json({ success: false, message: 'Authentication is required to hold a cart' });
    }
    const heldCount = await Order.countDocuments({ cashierId, status: 'HELD' });
    if (heldCount >= 10) {
      return res.status(400).json({ success: false, message: 'A cashier can hold up to 10 carts' });
    }
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
export const getHeldCarts = async (req, res) => {
  try {
    const held = await Order.find({ cashierId: req.user._id, status: 'HELD' }).sort({ createdAt: -1 });
    res.json({ success: true, count: held.length, data: held });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Resume or Delete Held Cart ──
export const deleteHeldCart = async (req, res) => {
  try {
    const held = await Order.findOneAndDelete({ _id: req.params.id, cashierId: req.user._id, status: 'HELD' });
    if (!held) {
      return res.status(404).json({ success: false, message: 'Held cart not found' });
    }
    res.json({ success: true, message: 'Held cart removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Orders History (scoped to current user) ──
export const getOrders = async (req, res) => {
  try {
    const { status = 'COMPLETED', limit = 50 } = req.query;
    const filter = { cashierId: req.user._id };
    if (status !== 'ALL') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('cashierId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Single Order (scoped to current user) ──
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, cashierId: req.user._id })
      .populate('cashierId', 'name email')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Order / Dashboard Analytics (scoped to current user) ──
export const getOrderStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, allCompleted, recentOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart }, status: 'COMPLETED', cashierId: req.user._id }),
      Order.find({ status: 'COMPLETED', cashierId: req.user._id }),
      Order.find({ status: 'COMPLETED', cashierId: req.user._id }).sort({ createdAt: -1 }).limit(5),
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
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
