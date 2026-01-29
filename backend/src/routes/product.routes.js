import express from "express";
import {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/product.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

// public / cashier
router.get("/", protect, getProducts);
router.get("/barcode/:barcode", protect, getProductByBarcode);

// admin only
router.post("/", protect, isAdmin, createProduct);
router.put("/:id", protect, isAdmin, updateProduct);
router.delete("/:id", protect, isAdmin, deleteProduct);

export default router;
