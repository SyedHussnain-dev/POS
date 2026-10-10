import { Router } from 'express';
import {
  getReceipts,
  getReceipt,
  createReceipt,
  getDashboardStats,
} from '../controllers/receiptController.js';

const router = Router();

router.get('/stats', getDashboardStats);
router.route('/').get(getReceipts).post(createReceipt);
router.route('/:id').get(getReceipt);

export default router;
