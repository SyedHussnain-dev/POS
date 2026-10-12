import Product from '../models/Product.js';

// ── Get all products with filters (scoped to current user) ──
export const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, availableOnly } = req.query;
    const filter = { userId: req.user._id };

    if (availableOnly === 'true') {
      filter.isAvailable = true;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
    }

    const products = await Product.find(filter).sort({ name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single product (scoped to current user) ──
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Lookup product by barcode (scoped to current user) ──
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'No product matched this barcode' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Create product (owned by current user) ──
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Update product (scoped to current user) ──
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Delete product (scoped to current user) ──
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Low stock alert stats (scoped to current user) ──
export const getStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await Product.find({
      userId: req.user._id,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }).sort({ stockQuantity: 1 });

    res.json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
