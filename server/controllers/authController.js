import User from '../models/User.js';

export const login = async (req, res) => {
  const { username, password } = req.body;
  const email = process.env.LOCAL_CASHIER_EMAIL || 'cashier@pos.com';
  const expectedPassword = process.env.LOCAL_CASHIER_PASSWORD || 'CashierPassword123!';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username.trim().toLowerCase() !== email.toLowerCase() || password !== expectedPassword) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(503).json({
      success: false,
      message: 'Cashier account not found. Run npm run seed to initialize the database.',
    });
  }

  return res.json({
    success: true,
    data: {
      user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    },
  });
};
