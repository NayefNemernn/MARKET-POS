import express from "express";
import upload from "../middleware/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  getAllProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

// All routes — any authenticated user (data is scoped to their userId in controller)
router.get("/", protect, getAllProducts);
router.get("/barcode/:barcode", protect, getProductByBarcode);
router.post("/", protect, upload.single("image"), createProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;