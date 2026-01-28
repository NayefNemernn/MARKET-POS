import express from "express";

const router = express.Router();

// TEMP test route
router.post("/login", (req, res) => {
  res.json({ message: "Login route working" });
});

export default router;
