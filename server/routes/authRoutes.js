import express from 'express';
import { login, pinSwitch, getMe, getStaff } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/pin-switch', pinSwitch);
router.get('/me', protect, getMe);
router.get('/staff', protect, getStaff);

export default router;
