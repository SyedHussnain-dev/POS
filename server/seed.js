import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import User from './models/User.js';
import Product from './models/Product.js';
import Shift from './models/Shift.js';
import Order from './models/Order.js';
import Item from './models/Item.js';
import Receipt from './models/Receipt.js';

// ── Demo Users from Spec ──
const rawUsers = [
  {
    email: 'admin@pos.com',
    password: 'AdminPassword123!',
    pin: '1111',
    name: 'System Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    email: 'manager@pos.com',
    password: 'ManagerPassword123!',
    pin: '2222',
    name: 'Store Manager',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    email: 'cashier@pos.com',
    password: 'CashierPassword123!',
    pin: '3333',
    name: 'Alex Cashier',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
];

// ── Next-Gen Products Catalog ──
const productsData = [
  {
    name: 'Artisan Espresso',
    sku: 'BEV-ESP-01',
    barcode: '8901001',
    category: 'Beverages',
    costPrice: 1.2,
    sellingPrice: 3.5,
    stockQuantity: 120,
    reorderLevel: 25,
    taxRate: 5,
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Velvet Cappuccino',
    sku: 'BEV-CAP-02',
    barcode: '8901002',
    category: 'Beverages',
    costPrice: 1.6,
    sellingPrice: 4.5,
    stockQuantity: 95,
    reorderLevel: 20,
    taxRate: 5,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Vanilla Oat Latte',
    sku: 'BEV-LAT-03',
    barcode: '8901003',
    category: 'Beverages',
    costPrice: 1.8,
    sellingPrice: 4.95,
    stockQuantity: 80,
    reorderLevel: 20,
    taxRate: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Cold Pressed Orange Juice',
    sku: 'BEV-OJ-04',
    barcode: '8901004',
    category: 'Beverages',
    costPrice: 1.4,
    sellingPrice: 3.75,
    stockQuantity: 45,
    reorderLevel: 15,
    taxRate: 0,
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Avocado Caesar Salad',
    sku: 'FOD-SAL-01',
    barcode: '8902001',
    category: 'Food',
    costPrice: 4.5,
    sellingPrice: 10.99,
    stockQuantity: 35,
    reorderLevel: 10,
    taxRate: 8,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Smoked Chicken Panini',
    sku: 'FOD-PAN-02',
    barcode: '8902002',
    category: 'Food',
    costPrice: 3.8,
    sellingPrice: 9.5,
    stockQuantity: 28,
    reorderLevel: 10,
    taxRate: 8,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Truffle Margherita Pizza',
    sku: 'FOD-PIZ-03',
    barcode: '8902003',
    category: 'Food',
    costPrice: 5.2,
    sellingPrice: 14.99,
    stockQuantity: 22,
    reorderLevel: 8,
    taxRate: 8,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Sea Salt Kettle Chips',
    sku: 'SNK-CHP-01',
    barcode: '8903001',
    category: 'Snacks',
    costPrice: 0.9,
    sellingPrice: 2.75,
    stockQuantity: 180,
    reorderLevel: 30,
    taxRate: 0,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Organic Almond Granola',
    sku: 'SNK-GRN-02',
    barcode: '8903002',
    category: 'Snacks',
    costPrice: 1.1,
    sellingPrice: 2.99,
    stockQuantity: 9, // low stock trigger
    reorderLevel: 15,
    taxRate: 0,
    imageUrl: 'https://images.unsplash.com/photo-1517093707567-9c9c1b3f9ff6?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Belgian Dark Chocolate Brownie',
    sku: 'DST-BRW-01',
    barcode: '8904001',
    category: 'Desserts',
    costPrice: 1.5,
    sellingPrice: 4.5,
    stockQuantity: 40,
    reorderLevel: 12,
    taxRate: 5,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'New York Baked Cheesecake',
    sku: 'DST-CHK-02',
    barcode: '8904002',
    category: 'Desserts',
    costPrice: 2.2,
    sellingPrice: 6.25,
    stockQuantity: 8, // low stock trigger
    reorderLevel: 15,
    taxRate: 5,
    imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'POS Thermal Paper Roll (50pk)',
    sku: 'MER-PPR-01',
    barcode: '8905001',
    category: 'General',
    costPrice: 12.0,
    sellingPrice: 24.99,
    stockQuantity: 15,
    reorderLevel: 5,
    taxRate: 8,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.host}`);

    // ── Clear existing collections ──
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Shift.deleteMany({}),
      Order.deleteMany({}),
      Item.deleteMany({}),
      Receipt.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    // ── Seed Users with Hashed Passwords ──
    const usersToInsert = [];
    for (const u of rawUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      usersToInsert.push({
        ...u,
        password: hashedPassword,
        pin: await bcrypt.hash(u.pin, 10),
      });
    }
    const createdUsers = await User.insertMany(usersToInsert);
    console.log(`Seeded ${createdUsers.length} staff users with bcrypt passwords & PINs.`);

    // ── Seed Products (assigned to cashier user) ──
    const cashierUser = createdUsers.find((u) => u.email === 'cashier@pos.com');
    const productsWithOwner = productsData.map((p) => ({ ...p, userId: cashierUser._id }));
    const createdProducts = await Product.insertMany(productsWithOwner);
    console.log(`Seeded ${createdProducts.length} products across 5 categories.`);

    // Also populate legacy Item collection for backwards compatibility
    const legacyItems = createdProducts.map((p) => ({
      name: p.name,
      price: p.sellingPrice,
      category: p.category,
      stock: p.stockQuantity,
      barcode: p.barcode,
    }));
    await Item.insertMany(legacyItems);
    console.log(`Synced ${legacyItems.length} items to legacy collection.`);

    // ── Seed Initial Open Shift for Alex Cashier ──
    const shift = await Shift.create({
      cashierId: cashierUser._id,
      openingTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // opened 4 hours ago
      openingFloat: 150.0,
      expectedCash: 150.0,
      actualCash: 0,
      cashDifference: 0,
      totalSales: 0,
      totalTransactions: 0,
      status: 'OPEN',
    });

    await User.findByIdAndUpdate(cashierUser._id, { activeShiftId: shift._id });
    console.log(`Seeded initial OPEN shift (Float: $150.00) for cashier: ${cashierUser.name}`);

    // ── Seed Sample Completed Orders ──
    const p1 = createdProducts[0]; // Artisan Espresso $3.5
    const p2 = createdProducts[1]; // Velvet Cappuccino $4.5
    const p5 = createdProducts[4]; // Avocado Caesar Salad $10.99

    const sampleOrders = [
      {
        orderNumber: 'ORD-700101',
        cashierId: cashierUser._id,
        shiftId: shift._id,
        items: [
          { productId: p1._id, name: p1.name, quantity: 2, unitPrice: p1.sellingPrice, subtotal: 7.0 },
          { productId: p2._id, name: p2.name, quantity: 1, unitPrice: p2.sellingPrice, subtotal: 4.5 },
        ],
        subtotal: 11.5,
        taxTotal: 0.58,
        discountTotal: 0,
        grandTotal: 12.08,
        payments: [{ method: 'CASH', amount: 20.0 }],
        changeGiven: 7.92,
        customer: { name: 'Sarah Jenkins', phone: '+1 555-0192', loyaltyPointsEarned: 12 },
        status: 'COMPLETED',
      },
      {
        orderNumber: 'ORD-700102',
        cashierId: cashierUser._id,
        shiftId: shift._id,
        items: [
          { productId: p5._id, name: p5.name, quantity: 1, unitPrice: p5.sellingPrice, subtotal: 10.99 },
          { productId: p1._id, name: p1.name, quantity: 1, unitPrice: p1.sellingPrice, subtotal: 3.5 },
        ],
        subtotal: 14.49,
        taxTotal: 1.05,
        discountTotal: 1.5,
        grandTotal: 14.04,
        payments: [{ method: 'CARD', amount: 14.04, reference: 'AUTH-VISA-9912' }],
        changeGiven: 0,
        customer: { name: 'David Miller', phone: '+1 555-0144', loyaltyPointsEarned: 14 },
        status: 'COMPLETED',
      },
    ];

    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`Seeded ${createdOrders.length} initial completed orders.`);

    // Also populate legacy Receipt collection
    const legacyReceipts = createdOrders.map((o) => ({
      receiptNumber: o.orderNumber,
      items: o.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: i.unitPrice,
        total: i.subtotal,
      })),
      subtotal: o.subtotal,
      tax: o.taxTotal,
      discount: o.discountTotal,
      grandTotal: o.grandTotal,
      paymentMethod: o.payments[0]?.method === 'CARD' ? 'card' : 'cash',
    }));
    await Receipt.insertMany(legacyReceipts);

    // Update shift metrics
    const cashNet = 20.0 - 7.92;
    await Shift.findByIdAndUpdate(shift._id, {
      $inc: {
        totalSales: 12.08 + 14.04,
        totalTransactions: 2,
        expectedCash: cashNet,
      },
    });

    console.log('✅ Next-Gen 3D MERN POS Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
