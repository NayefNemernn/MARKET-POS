import express from "express";
import { protect, isSuperAdmin } from "../middleware/auth.middleware.js";
import {
  getAllStores,
  getStoreDetails,
  updateStorePlan,
  toggleStoreActive,
  getPlatformStats,
  createSuperAdmin,
} from "../controllers/superadmin.controller.js";

const router = express.Router();

// One-time setup — no auth needed (only works if no superadmin exists yet)
router.post("/create", createSuperAdmin);

// All other routes require superadmin
router.use(protect, isSuperAdmin);

router.get("/stats",                   getPlatformStats);
router.get("/stores",                  getAllStores);
router.get("/stores/:id",              getStoreDetails);
router.put("/stores/:id/plan",         updateStorePlan);
router.put("/stores/:id/toggle",       toggleStoreActive);

export default router;