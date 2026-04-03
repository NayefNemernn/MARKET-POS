// stock.routes.js
import express from "express";
import { adjustStock, getStockLogs } from "../controllers/stock.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/adjust",  protect, isAdmin, adjustStock);
router.get("/logs",     protect, getStockLogs);

export default router;