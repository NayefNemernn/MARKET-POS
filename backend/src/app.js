import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import holdSaleRoutes from "./routes/holdSale.routes.js";

dotenv.config();

const app = express();

/* =======================
   MIDDLEWARE
======================= */
// ✅ FIX: Accept the configured CLIENT_URL, any Vercel preview URL,
// and localhost — so CORS never breaks on new Vercel deployments.
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,          // e.g. https://nemer-pos.vercel.app
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl (no origin header)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview deployment automatically
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow explicitly listed origins
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hold-sales", holdSaleRoutes);

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.send("Market POS API running");
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;