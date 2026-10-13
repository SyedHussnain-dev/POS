import express from 'express';
import { getSalesReport, getZReports } from '../controllers/reportController.js';
import { useLocalCashier } from '../middleware/localCashier.js';

const router = express.Router();

router.use(useLocalCashier);
router.get('/sales', getSalesReport);
router.get('/z-reports', getZReports);

export default router;
