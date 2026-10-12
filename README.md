# Point of Sale (POS) System

A modern full-stack Point of Sale (MERN stack) web application designed for fast, responsive retail management.

## 🚀 Live Deployments

- **Frontend (Vercel):** [https://pos-silk-phi.vercel.app](https://pos-silk-phi.vercel.app)
- **Backend (Render):** [https://pos-8zul.onrender.com](https://pos-8zul.onrender.com)
- **Database:** MongoDB Atlas (M0 Free Cluster)

---

## 📁 Project Structure

```text
POS/
├── client/                 # Frontend React application (Vite)
│   ├── src/
│   │   ├── api/            # Axios API client with dynamic baseURL
│   │   ├── components/     # Reusable UI components (Sidebar, Topbar, Modal, DataTable, KPICard)
│   │   ├── pages/          # Application views (Dashboard, POS, Items, Receipts)
│   │   ├── styles/         # Global design tokens and styles
│   │   └── utils/          # PDF generation & receipt printing helpers
│   ├── public/             # Static assets (favicons, SVG icons)
│   ├── index.html
│   └── vite.config.js
├── server/                 # Backend Node.js / Express API
│   ├── config/             # Database connection (Mongoose)
│   ├── controllers/        # Request controllers (Items, Receipts, Stats)
│   ├── models/             # Mongoose schemas (Item, Receipt)
│   ├── routes/             # Express API routes (/api/items, /api/receipts)
│   ├── seed.js             # Initial database seed script
│   └── server.js           # Express app entrypoint with CORS & health checks
├── package.json            # Root workspace scripts
└── vercel.json             # Vercel deployment and routing configuration
```

---

## 🛠️ Features

- **Dashboard:** Real-time KPI metrics (Revenue, Items Sold, Receipts) and sales overview.
- **POS Terminal:** Interactive category filters, product search, cart calculation, discount/tax handling, and instant checkout.
- **Receipts:** Historical transaction logs and downloadable 80mm PDF receipts.
- **Items Management:** Complete inventory CRUD with real-time stock updates.
- **Automated Stock Deduction:** Completing a sale automatically decrements item inventory in MongoDB.

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables

**`server/.env`:**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

**`client/.env` (optional for local dev):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Sample Data (Optional)
```bash
npm run seed
```

### 4. Run Locally
From the workspace root:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## 🌐 Production Architecture

```text
[ Vercel (Frontend) ] ─── HTTPS / CORS ───> [ Render (Backend) ] ─── Mongoose ───> [ MongoDB Atlas ]
```

- **Vercel** serves the client SPA bundle with route rewrites to `/index.html`.
- **Render** runs the Node.js Express server with CORS allowed for the Vercel domain.
- **MongoDB Atlas** provides managed cloud database storage with `0.0.0.0/0` network access.
