import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

/* GET ALL USERS */
router.get("/", protect, isAdmin, async (req, res) => {
  const users = await User.find().select("-password -deviceId -sessionToken");
  res.json(users);
});

/* CREATE USER */
router.post("/", protect, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ username, password, role });

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
  if (!user) return res.status(404).json({ message: "User not found" });
  user.active = req.body.active;
  await user.save();
  res.json({ message: "User updated", active: user.active });
});

/* CHANGE PASSWORD — admin only */
router.post("/:id/change-password", protect, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "New password required" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    user.deviceId = null;       // force re-login on all devices
    user.sessionToken = null;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE USER */
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;