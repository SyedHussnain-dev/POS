import express from 'express';
import { getSalesReport, getZReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/sales', getSalesReport);
router.get('/z-reports', getZReports);

export default router;
