import express from 'express';
import {
  openShift,
  getCurrentShift,
  closeShift,
  getShiftHistory,
} from '../controllers/shiftController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(optionalAuth);

router.post('/open', openShift);
router.get('/current', getCurrentShift);
router.post('/close', closeShift);
router.get('/history', getShiftHistory);

export default router;
