import express from 'express';
import {
  openShift,
  getCurrentShift,
  closeShift,
  getShiftHistory,
} from '../controllers/shiftController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/open', openShift);
router.get('/current', getCurrentShift);
router.post('/close', closeShift);
router.get('/history', getShiftHistory);

export default router;
