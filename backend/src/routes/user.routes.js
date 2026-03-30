import express from "express";
import User from "../models/User.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

/* ── GET ALL USERS with full stats ── */
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -sessionToken");

    const usersWithStats = await Promise.all(users.map(async (u) => {
      const today = new Date(); today.setHours(0,0,0,0);

      const [totalSales, todaySales, totalProducts] = await Promise.all([
        Sale.aggregate([
          { $match: { userId: u._id } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Sale.aggregate([
          { $match: { userId: u._id, createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Product.countDocuments({ userId: u._id }),
      ]);

      return {
        _id:           u._id,
        username:      u.username,
        role:          u.role,
        active:        u.active,
        storeName:     u.storeName,
        maxDevices:    u.maxDevices || 1,
        devices:       u.devices   || [],
        deviceId:      u.deviceId,
        deviceName:    u.deviceName,
        deviceOS:      u.deviceOS,
        deviceBrowser: u.deviceBrowser,
        lastLoginAt:   u.lastLoginAt,
        lastLoginIP:   u.lastLoginIP,
        createdAt:     u.createdAt,
        isOnline:      (u.devices?.length > 0) || !!u.deviceId,
        activeDevices: u.devices?.length || (u.deviceId ? 1 : 0),
        stats: {
          totalRevenue:   totalSales[0]?.total  || 0,
          totalOrders:    totalSales[0]?.count  || 0,
          todayRevenue:   todaySales[0]?.total  || 0,
          todayOrders:    todaySales[0]?.count  || 0,
          totalProducts,
        }
      };
    }));

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET USER SALES HISTORY ── */
router.get("/:id/sales", protect, isAdmin, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("total paymentMethod createdAt items");
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET ADMIN GLOBAL STATS ── */
router.get("/admin/global-stats", protect, isAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);

    const [totalUsers, activeUsers, todaySales, monthSales, totalSales, totalProducts, topUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ deviceId: { $ne: null } }),
      Sale.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: { createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
      Product.countDocuments(),
      Sale.aggregate([
        { $group: { _id: "$userId", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { username: "$user.username", revenue: 1, orders: 1 } }
      ]),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      todayRevenue:  todaySales[0]?.total  || 0,
      todayOrders:   todaySales[0]?.count  || 0,
      monthRevenue:  monthSales[0]?.total  || 0,
      monthOrders:   monthSales[0]?.count  || 0,
      totalRevenue:  totalSales[0]?.total  || 0,
      totalOrders:   totalSales[0]?.count  || 0,
      totalProducts,
      topUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CREATE USER ── */
router.post("/", protect, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing fields" });
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: "User already exists" });
  const user = await User.create({ username, password, role });
  res.status(201).json({ _id: user._id, username: user.username, role: user.role, active: user.active });
});

/* ── ENABLE / DISABLE USER / UPDATE ROLE / MAX DEVICES ── */
router.patch("/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (req.body.active     !== undefined) user.active     = req.body.active;
  if (req.body.role       !== undefined) user.role       = req.body.role;
  if (req.body.maxDevices !== undefined) {
    const max = parseInt(req.body.maxDevices);
    if (max >= 1 && max <= 10) user.maxDevices = max;
  }
  await user.save();
  res.json({ message: "User updated" });
});

/* ── FORCE LOGOUT ALL DEVICES ── */
router.post("/:id/force-logout", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      devices: [], deviceId: null, sessionToken: null
    });
    res.json({ message: "User force logged out from all devices" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── FORCE LOGOUT ONE SPECIFIC DEVICE ── */
router.post("/:id/force-logout-device", protect, isAdmin, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.devices = user.devices.filter(d => d.deviceId !== deviceId);
    if (user.deviceId === deviceId) {
      user.deviceId = user.devices[0]?.deviceId || null;
      user.sessionToken = user.devices[0]?.sessionToken || null;
    }
    await user.save();
    res.json({ message: "Device logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CHANGE PASSWORD ── */
router.post("/:id/change-password", protect, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "New password required" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password     = newPassword;
    user.deviceId     = null;
    user.sessionToken = null;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ── DELETE USER ── */
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ── UPDATE OWN STORE NAME ── */
router.patch("/me/store-name", protect, async (req, res) => {
  try {
    const { storeName } = req.body;
    if (!storeName?.trim()) return res.status(400).json({ message: "Store name is required" });
    const user = await User.findByIdAndUpdate(req.user._id, { storeName: storeName.trim() }, { new: true });
    res.json({ storeName: user.storeName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ── CLEAR USER SALES ── */
router.delete("/:id/clear-sales", protect, isAdmin, async (req, res) => {
  try {
    const result = await Sale.deleteMany({ userId: req.params.id });
    res.json({ message: `Deleted ${result.deletedCount} sales`, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CLEAR USER PRODUCTS ── */
router.delete("/:id/clear-products", protect, isAdmin, async (req, res) => {
  try {
    const result = await Product.deleteMany({ userId: req.params.id });
    res.json({ message: `Deleted ${result.deletedCount} products`, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CLEAR EVERYTHING (sales + products) ── */
router.delete("/:id/clear-all", protect, isAdmin, async (req, res) => {
  try {
    const [salesResult, productsResult] = await Promise.all([
      Sale.deleteMany({ userId: req.params.id }),
      Product.deleteMany({ userId: req.params.id }),
    ]);
    res.json({
      message: `Cleared ${salesResult.deletedCount} sales and ${productsResult.deletedCount} products`,
      sales:    salesResult.deletedCount,
      products: productsResult.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;