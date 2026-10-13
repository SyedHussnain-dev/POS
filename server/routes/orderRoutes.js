import express from 'express';
import {
  createOrder,
  holdCart,
  getHeldCarts,
  deleteHeldCart,
  getOrders,
  getOrderById,
  getOrderStats,
} from '../controllers/orderController.js';
import { useLocalCashier } from '../middleware/localCashier.js';

const router = express.Router();

router.use(useLocalCashier);

router.get('/stats', getOrderStats);
router.get('/held', getHeldCarts);
router.delete('/held/:id', deleteHeldCart);
router.post('/hold', holdCart);
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);

export default router;
