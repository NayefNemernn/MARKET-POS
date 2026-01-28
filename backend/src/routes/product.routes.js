import express from "express";
import {
  createProduct,
  getByBarcode,
  getProducts
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/barcode/:barcode", getByBarcode);

export default router;
