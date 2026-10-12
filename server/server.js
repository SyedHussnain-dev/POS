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
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Health Check ──
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'POS Backend API is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

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
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
