import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";

import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes       from "./routes/auth.routes.js";
import productRoutes    from "./routes/product.routes.js";
import saleRoutes       from "./routes/sale.routes.js";
import categoryRoutes   from "./routes/category.routes.js";
import dashboardRoutes  from "./routes/dashboard.routes.js";
import userRoutes       from "./routes/user.routes.js";
import holdSaleRoutes   from "./routes/holdSale.routes.js";
import storeRoutes      from "./routes/store.routes.js";
import superadminRoutes from "./routes/superadmin.routes.js";
import customerRoutes   from "./routes/customer.routes.js";
import stockRoutes      from "./routes/stock.routes.js";
import auditRoutes      from "./routes/audit.routes.js";
import shiftRoutes      from "./routes/shift.routes.js";

dotenv.config();
const app = express();

const ALLOWED_ORIGINS = [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

app.use("/api/auth",        authRoutes);
app.use("/api/products",    productRoutes);
app.use("/api/sales",       saleRoutes);
app.use("/api/categories",  categoryRoutes);
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/hold-sales",  holdSaleRoutes);
app.use("/api/store",       storeRoutes);
app.use("/api/superadmin",  superadminRoutes);
app.use("/api/customers",   customerRoutes);
app.use("/api/stock",       stockRoutes);
app.use("/api/audit",       auditRoutes);
app.use("/api/shifts",      shiftRoutes);

app.get("/", (req, res) => res.send("Market POS API running ✅"));
app.use(errorHandler);

export default app;