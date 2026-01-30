import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";
import {
  getAllProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/product.controller.js";

const router = express.Router();

// POS – scan barcode
router.get("/barcode/:barcode", protect, getProductByBarcode);

// ADMIN – all products
router.get("/", protect, isAdmin, getAllProducts);

// ADMIN – create product
router.post("/", protect, isAdmin, createProduct);

// ADMIN – update product
router.put("/:id", protect, isAdmin, updateProduct);

// ADMIN – delete product
router.delete("/:id", protect, isAdmin, deleteProduct);

export default router;
