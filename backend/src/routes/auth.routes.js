import express from "express";
import { login, register } from "../controllers/auth.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public — anyone can log in
router.post("/login", login);

// Protected — only admins can create new users
router.post("/register", protect, isAdmin, register);

export default router;