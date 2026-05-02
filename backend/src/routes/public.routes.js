import express from "express";
import { getStoreInfo, getPublicProducts } from "../controllers/public.controller.js";

const router = express.Router();

router.get("/:slug",          getStoreInfo);
router.get("/:slug/products", getPublicProducts);

export default router;
