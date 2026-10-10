import 'dotenv/config';
import mongoose from 'mongoose';
import Item from './models/Item.js';
import Receipt from './models/Receipt.js';

// ── Seed data ──
const items = [
  { name: 'Espresso', price: 3.5, category: 'Beverages', stock: 100, barcode: 'BEV001' },
  { name: 'Cappuccino', price: 4.5, category: 'Beverages', stock: 80, barcode: 'BEV002' },
  { name: 'Latte', price: 4.75, category: 'Beverages', stock: 90, barcode: 'BEV003' },
  { name: 'Orange Juice', price: 3.25, category: 'Beverages', stock: 60, barcode: 'BEV004' },
  { name: 'Caesar Salad', price: 9.99, category: 'Food', stock: 30, barcode: 'FOD001' },
  { name: 'Grilled Chicken Wrap', price: 8.5, category: 'Food', stock: 25, barcode: 'FOD002' },
  { name: 'Margherita Pizza', price: 12.99, category: 'Food', stock: 20, barcode: 'FOD003' },
  { name: 'Potato Chips', price: 2.5, category: 'Snacks', stock: 150, barcode: 'SNK001' },
  { name: 'Granola Bar', price: 1.99, category: 'Snacks', stock: 120, barcode: 'SNK002' },
  { name: 'Mixed Nuts', price: 4.99, category: 'Snacks', stock: 70, barcode: 'SNK003' },
  { name: 'Chocolate Brownie', price: 3.99, category: 'Desserts', stock: 40, barcode: 'DST001' },
  { name: 'Cheesecake Slice', price: 5.5, category: 'Desserts', stock: 35, barcode: 'DST002' },
];

// Customers removed

// ── Run seed ──
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Item.deleteMany({});
    await Receipt.deleteMany({});
    console.log('Cleared existing data');

    const createdItems = await Item.insertMany(items);
    console.log(`Seeded ${createdItems.length} items`);

    // ── Sample receipts ──
    const receipts = [
      {
        receiptNumber: 'RCP-SEED-001',
        items: [
          {
            item: createdItems[0]._id,
            name: createdItems[0].name,
            qty: 2,
            price: createdItems[0].price,
            total: createdItems[0].price * 2,
          },
          {
            item: createdItems[4]._id,
            name: createdItems[4].name,
            qty: 1,
            price: createdItems[4].price,
            total: createdItems[4].price,
          },
        ],
        subtotal: 16.99,
        tax: 1.36,
        discount: 0,
        grandTotal: 18.35,
        paymentMethod: 'card',
      },
      {
        receiptNumber: 'RCP-SEED-002',
        items: [
          {
            item: createdItems[6]._id,
            name: createdItems[6].name,
            qty: 1,
            price: createdItems[6].price,
            total: createdItems[6].price,
          },
          {
            item: createdItems[1]._id,
            name: createdItems[1].name,
            qty: 2,
            price: createdItems[1].price,
            total: createdItems[1].price * 2,
          },
        ],
        subtotal: 21.99,
        tax: 1.76,
        discount: 0,
        grandTotal: 23.75,
        paymentMethod: 'cash',
      },
      {
        receiptNumber: 'RCP-SEED-003',
        items: [
          {
            item: createdItems[10]._id,
            name: createdItems[10].name,
            qty: 3,
            price: createdItems[10].price,
            total: createdItems[10].price * 3,
          },
        ],
        subtotal: 11.97,
        tax: 0.96,
        discount: 0,
        grandTotal: 12.93,
        paymentMethod: 'card',
      },
    ];

    const createdReceipts = await Receipt.insertMany(receipts);
    console.log(`Seeded ${createdReceipts.length} receipts`);

    console.log(`Seeded ${createdReceipts.length} receipts`);

    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error(`Seed error: ${err.message}`);
    process.exit(1);
  }
}

seed();
