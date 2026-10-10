import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import itemRoutes from './routes/itemRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';

// ── Connect to database ──
connectDB();

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ──
app.use('/api/items', itemRoutes);
app.use('/api/receipts', receiptRoutes);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
