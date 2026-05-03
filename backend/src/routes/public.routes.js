import express from "express";
import { getStoreInfo, getPublicProducts } from "../controllers/public.controller.js";
import {
  registerCustomer, loginCustomer,
  getProfile, updateProfile, verifyCustomer,
} from "../controllers/customerAuth.controller.js";

const router = express.Router();

router.get("/:slug",          getStoreInfo);
router.get("/:slug/products", getPublicProducts);

// Customer auth
router.post("/:slug/auth/register", registerCustomer);
router.post("/:slug/auth/login",    loginCustomer);
router.get("/:slug/auth/me",        verifyCustomer, getProfile);
router.patch("/:slug/auth/me",      verifyCustomer, updateProfile);

export default router;
