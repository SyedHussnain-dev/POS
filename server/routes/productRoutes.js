import express from 'express';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getStockAlerts,
} from '../controllers/productController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/alerts/low-stock', getStockAlerts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize('SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_SPECIALIST'), createProduct);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_SPECIALIST'), updateProduct);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'STORE_MANAGER'), deleteProduct);

export default router;
