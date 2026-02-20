import express from "express";
import { login, register } from "../controllers/auth.controller.js";

const router = express.Router();

// ✅ create user
router.post("/register", register);

// ✅ login user
router.post("/login", login);

export default router;  