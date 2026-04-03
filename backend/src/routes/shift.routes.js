// shift.routes.js
import express from "express";
import { getActiveShift, getShifts, openShift, closeShift } from "../controllers/shift.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/active",   protect, getActiveShift);
router.get("/",         protect, getShifts);
router.post("/open",    protect, openShift);
router.post("/:id/close", protect, closeShift);

export default router;