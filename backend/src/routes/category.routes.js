import express from "express";
import Category from "../models/Category.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET ALL CATEGORIES (user-scoped)
router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to load categories", error: err.message });
  }
});

// CREATE CATEGORY (user-scoped)
router.post("/", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    // Check if this user already has a category with this name
    const exists = await Category.findOne({ name: name.trim(), userId: req.user._id });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name: name.trim(), userId: req.user._id });
    res.status(201).json(category);
  } catch (err) {
    // Handle MongoDB duplicate key error gracefully
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
});

// DELETE CATEGORY (user-scoped)
router.delete("/:id", protect, async (req, res) => {
  try {
    await Category.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

export default router;