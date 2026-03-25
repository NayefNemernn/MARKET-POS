import express from "express";
import { login, logout, register, getUsers, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/users", getUsers);              // public — for login page
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/register", protect, isAdmin, register);
router.post("/change-password", protect, isAdmin, changePassword);

export default router;