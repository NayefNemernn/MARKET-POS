# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MARKET-POS is a full-stack Point-of-Sale system supporting multiple stores with role-based access (superadmin, admin, cashier). It has offline-first support via PWA/IndexedDB and a service worker.

## Repository Structure

```
/
├── frontend/   # React + Vite SPA
└── backend/    # Node.js + Express REST API
```

## Commands

### Frontend (`/frontend`)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (`/backend`)
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start without auto-reload
```

No test or lint scripts are configured in either workspace.

## Environment Variables

**Backend** requires a `.env` with at minimum:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Secret for signing JWT tokens
- `PORT` — Server port (default 5000)
- Supabase credentials for file storage

**Frontend** requires a `.env` with:
- `VITE_API_URL` — Backend API base URL

## Architecture

### Backend (MVC, Express)

- `src/app.js` — Express app setup: mounts all routes, applies CORS and middleware
- `src/server.js` — Entry point, starts HTTP server
- `src/models/` — Mongoose schemas: User, Store, Product, Sale, Customer, Category, Discount, Expense, Shift, Stock, Supplier, Payment, HoldSale, AuditLog
- `src/controllers/` — Business logic per resource
- `src/routes/` — REST route definitions per resource
- `src/middleware/` — JWT auth, role-based access control, file upload (multer)
- `src/config/` — `db.js` (MongoDB with retry logic), `supabase.js` (file storage), `env.js`

**Multi-tenancy model:** Every resource belongs to a Store. Users have a role (`superadmin` / `admin` / `cashier`). Superadmin can access all stores; admin and cashier are scoped to their store.

### Frontend (React + Vite)

- `src/App.jsx` — Root component with route definitions
- `src/context/` — Global state via React Context: `AuthContext`, `CartContext`, `CurrencyContext`, `LanguageContext`, `ThemeContext`, `RefreshContext`
- `src/hooks/` — Custom hooks (auth, cart, voice input, translations, offline sales, products)
- `src/api/` — Axios service modules per resource (auth, product, sale, customer, etc.)
- `src/pages/` — One file per page: Dashboard, POS, Products, Categories, Reports, PayLater, Customers, Shift, Stock, Expenses, Discounts, Suppliers, Users, AdminPanel, SuperAdminPanel, Login, Register
- `src/components/` — Reusable and page-specific UI components
- `src/i18n/` — Translation files for multi-language support
- `public/sw.js` — Service worker for offline functionality
- `src/utils/offlineDB.js` — IndexedDB wrapper for offline sales queue

**Offline flow:** Sales made without connectivity are queued in IndexedDB and synced when the connection is restored via the service worker.

## Key Patterns

- **Auth:** JWT stored in localStorage; `AuthContext` exposes `user`, `token`, and `logout`. The backend `auth` middleware validates the token on protected routes.
- **Split payments:** Sales support multiple payment methods in a single transaction (tracked in the `Sale` model's `payments` array).
- **File uploads:** Product images go through multer on the backend, then are stored in Supabase; the URL is saved in MongoDB.
- **Audit logging:** Sensitive operations (stock changes, user management) write to `AuditLog`.

## Deployment

- **Frontend:** Vercel
- **Backend:** Railway or Render
- **Database:** MongoDB Atlas
- **File storage:** Supabase
