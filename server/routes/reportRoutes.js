import express from 'express';
import { getSalesReport, getZReports } from '../controllers/reportController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('SUPER_ADMIN', 'STORE_MANAGER'));
router.get('/sales', getSalesReport);
router.get('/z-reports', getZReports);

export default router;
