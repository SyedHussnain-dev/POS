import Shift from '../models/Shift.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// ── Open Register Shift ──
export const openShift = async (req, res) => {
  try {
    const cashierId = req.user?._id || req.body.cashierId;
    const { openingFloat } = req.body;

    if (!cashierId) {
      return res.status(400).json({ success: false, message: 'Cashier ID required to open shift' });
    }

    if (openingFloat === undefined || openingFloat < 0) {
      return res.status(400).json({ success: false, message: 'Valid opening cash float is required' });
    }

    // Check if an open shift already exists for this cashier
    let existingShift = await Shift.findOne({ cashierId, status: 'OPEN' });
    if (existingShift) {
      return res.json({
        success: true,
        message: 'Shift already open',
        data: existingShift,
      });
    }

    const shift = await Shift.create({
      cashierId,
      openingFloat: Number(openingFloat),
      expectedCash: Number(openingFloat),
      actualCash: 0,
      cashDifference: 0,
      totalSales: 0,
      totalTransactions: 0,
      status: 'OPEN',
    });

    await User.findByIdAndUpdate(cashierId, { activeShiftId: shift._id });

    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Current Active Shift ──
export const getCurrentShift = async (req, res) => {
  try {
    const cashierId = req.user?._id || req.query.cashierId;
    let filter = { status: 'OPEN' };
    if (cashierId) filter.cashierId = cashierId;

    const shift = await Shift.findOne(filter).populate('cashierId', 'name email role');
    if (!shift) {
      return res.json({ success: true, data: null, message: 'No open shift found' });
    }

    // Aggregate orders for this shift
    const orders = await Order.find({ shiftId: shift._id, status: 'COMPLETED' });
    let totalCashReceived = 0;
    let totalCardReceived = 0;
    let totalOtherReceived = 0;
    let totalSales = 0;

    for (const ord of orders) {
      totalSales += ord.grandTotal || 0;
      for (const p of ord.payments || []) {
        if (p.method === 'CASH') totalCashReceived += p.amount;
        else if (p.method === 'CARD') totalCardReceived += p.amount;
        else totalOtherReceived += p.amount;
      }
    }

    totalCashReceived -= orders.reduce((sum, order) => sum + Number(order.changeGiven || 0), 0);

    const expectedCash = Number((shift.openingFloat + totalCashReceived).toFixed(2));

    res.json({
      success: true,
      data: {
        ...shift.toObject(),
        totalSales: Number(totalSales.toFixed(2)),
        totalTransactions: orders.length,
        cashSales: Number(totalCashReceived.toFixed(2)),
        cardSales: Number(totalCardReceived.toFixed(2)),
        otherSales: Number(totalOtherReceived.toFixed(2)),
        expectedCash,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Close Register Shift (Z-Report Generation) ──
export const closeShift = async (req, res) => {
  try {
    const cashierId = req.user?._id || req.body.cashierId;
    const { actualCash, shiftId } = req.body;

    if (actualCash === undefined || actualCash < 0) {
      return res.status(400).json({ success: false, message: 'Valid counted cash amount is required' });
    }

    let shift;
    if (shiftId) {
      shift = await Shift.findOne({ _id: shiftId, cashierId, status: 'OPEN' });
    } else if (cashierId) {
      shift = await Shift.findOne({ cashierId, status: 'OPEN' });
    }

    if (!shift || shift.status !== 'OPEN') {
      return res.status(404).json({ success: false, message: 'No open shift found to close' });
    }

    // Sum completed orders for this shift
    const orders = await Order.find({ shiftId: shift._id, status: 'COMPLETED' });
    let totalCashReceived = 0;
    let totalCardReceived = 0;
    let totalOtherReceived = 0;
    let totalSales = 0;

    for (const ord of orders) {
      totalSales += ord.grandTotal || 0;
      for (const p of ord.payments || []) {
        if (p.method === 'CASH') totalCashReceived += p.amount;
        else if (p.method === 'CARD') totalCardReceived += p.amount;
        else totalOtherReceived += p.amount;
      }
    }

    totalCashReceived -= orders.reduce((sum, order) => sum + Number(order.changeGiven || 0), 0);

    const expectedCash = Number((shift.openingFloat + totalCashReceived).toFixed(2));
    const cashDiff = Number((Number(actualCash) - expectedCash).toFixed(2));

    shift.closingTime = new Date();
    shift.actualCash = Number(actualCash);
    shift.expectedCash = expectedCash;
    shift.cashDifference = cashDiff;
    shift.totalSales = Number(totalSales.toFixed(2));
    shift.totalTransactions = orders.length;
    shift.status = 'CLOSED';

    await shift.save();

    // Clear active shift on cashier user
    await User.findByIdAndUpdate(shift.cashierId, { activeShiftId: null });

    // Return detailed Z-Report summary
    res.json({
      success: true,
      message: 'Shift closed successfully',
      zReport: {
        shiftId: shift._id,
        cashierId: shift.cashierId,
        openedAt: shift.openingTime,
        closedAt: shift.closingTime,
        openingFloat: shift.openingFloat,
        cashSales: Number(totalCashReceived.toFixed(2)),
        cardSales: Number(totalCardReceived.toFixed(2)),
        otherSales: Number(totalOtherReceived.toFixed(2)),
        totalSales: Number(totalSales.toFixed(2)),
        totalTransactions: orders.length,
        expectedCash,
        actualCountedCash: Number(actualCash),
        cashVariance: cashDiff,
        varianceStatus: cashDiff === 0 ? 'BALANCED' : cashDiff > 0 ? 'OVERAGE' : 'SHORTAGE',
      },
      data: shift,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Shift History / Audit Log ──
export const getShiftHistory = async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate('cashierId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
