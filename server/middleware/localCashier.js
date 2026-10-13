import User from '../models/User.js';

export const useLocalCashier = async (req, res, next) => {
  try {
    const email = process.env.LOCAL_CASHIER_EMAIL || 'cashier@pos.com';
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(503).json({
        success: false,
        message: 'Local cashier not found. Run npm run seed to initialize the database.',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
