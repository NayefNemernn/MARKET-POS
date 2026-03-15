import express from "express";
import upload from "../middleware/upload.middleware.js";

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

/* POS ACCESS */

router.get("/",protect,getAllProducts);
router.get("/barcode/:barcode",protect,getProductByBarcode);

/* ADMIN */

router.post(
"/",
protect,
isAdmin,
upload.single("image"),
createProduct
);

router.put(
"/:id",
protect,
isAdmin,
upload.single("image"),
updateProduct
);

router.delete(
"/:id",
protect,
isAdmin,
deleteProduct
);

export default router;