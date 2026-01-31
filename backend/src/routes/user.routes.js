import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

/* GET ALL USERS */
router.get("/", protect, isAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

/* CREATE USER */
router.post("/", protect, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = await User.findOne({ username });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    username,
    password,
    role
  });

  res.status(201).json({
    _id: user._id,
    username: user.username,
    role: user.role,
    active: user.active
  });
});

/* ENABLE / DISABLE USER */
router.patch("/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.active = req.body.active;
  await user.save();

  res.json({ message: "User updated", active: user.active });
});

export default router;
