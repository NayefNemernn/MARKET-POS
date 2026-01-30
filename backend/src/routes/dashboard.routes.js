import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, isAdmin, async (req, res) => {
  try {
    // Today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Today sales
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end }
    });

    const todaySales = sales.reduce((sum, s) => sum + s.total, 0);

    // Products
    const totalProducts = await Product.countDocuments();

    // Low stock (example: <= 5)
    const lowStock = await Product.countDocuments({
      stock: { $lte: 5 }
    });

    res.json({
      todaySales,
      totalProducts,
      lowStock
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard data failed" });
  }
});

export default router;
