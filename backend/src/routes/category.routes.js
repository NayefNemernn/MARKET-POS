import express from "express";
import Category from "../models/Category.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

// GET ALL CATEGORIES
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch {
    res.status(500).json({ message: "Failed to load categories" });
  }
});

// CREATE CATEGORY
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json(category);
  } catch {
    res.status(400).json({ message: "Failed to create category" });
  }
});

// DELETE CATEGORY
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch {
    res.status(400).json({ message: "Delete failed" });
  }
});

export default router;
