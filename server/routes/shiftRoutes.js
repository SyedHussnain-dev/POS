import express from 'express';
import {
  openShift,
  getCurrentShift,
  closeShift,
  getShiftHistory,
} from '../controllers/shiftController.js';
import { useLocalCashier } from '../middleware/localCashier.js';

const router = express.Router();

router.use(useLocalCashier);

router.post('/open', openShift);
router.get('/current', getCurrentShift);
router.post('/close', closeShift);
router.get('/history', getShiftHistory);

export default router;
