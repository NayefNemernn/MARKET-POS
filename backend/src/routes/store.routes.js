import express from "express";
import { protect, isAdmin } from "../middleware/auth.middleware.js";
import {
  getMyStore,
  updateStore,
  addCashier,
  updateCashier,
  removeCashier,
} from "../controllers/store.controller.js";

const router = express.Router();

router.use(protect);

// Store settings (admin only)
router.get( "/",              isAdmin, getMyStore);
router.put( "/",              isAdmin, updateStore);

// Cashier management (admin only)
router.post(  "/users",       isAdmin, addCashier);
router.put(   "/users/:id",   isAdmin, updateCashier);
router.delete("/users/:id",   isAdmin, removeCashier);

export default router;