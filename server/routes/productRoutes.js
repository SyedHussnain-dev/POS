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
import { useLocalCashier } from '../middleware/localCashier.js';

const router = express.Router();

router.use(useLocalCashier);

router.get('/alerts/low-stock', getStockAlerts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
