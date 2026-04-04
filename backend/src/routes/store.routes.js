import express from "express";
import { protect, isAdmin } from "../middleware/auth.middleware.js";
import {
  getMyStore, updateStore, addCashier, updateCashier, removeCashier,
} from "../controllers/store.controller.js";
import Store from "../models/Store.js";

const router = express.Router();
router.use(protect);

router.get("/",              isAdmin, getMyStore);
router.put("/",              isAdmin, updateStore);
router.post("/users",        isAdmin, addCashier);
router.put("/users/:id",     isAdmin, updateCashier);
router.delete("/users/:id",  isAdmin, removeCashier);

// Mark all notifications as read
router.post("/notifications/read", async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    store.notifications = (store.notifications || []).map(n => ({ ...n, read: true }));
    store.markModified("notifications");
    await store.save();
    res.json({ message: "Notifications marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;