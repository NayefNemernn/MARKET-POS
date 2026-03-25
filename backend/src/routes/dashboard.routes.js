import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Any authenticated user can access their own dashboard stats
router.get("/", protect, getDashboardStats);

export default router;