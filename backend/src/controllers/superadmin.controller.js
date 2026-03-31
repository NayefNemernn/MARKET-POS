import Store from "../models/Store.js";
import User from "../models/User.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

/* ─────────────────────────────────────────────
   GET ALL STORES
   GET /api/superadmin/stores
───────────────────────────────────────────── */
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("owner", "username")
      .sort({ createdAt: -1 });

    // Attach user/product counts
    const enriched = await Promise.all(
      stores.map(async (store) => {
        const [userCount, productCount, salesTotal] = await Promise.all([
          User.countDocuments({ storeId: store._id, active: true }),
          Product.countDocuments({ storeId: store._id }),
          Sale.aggregate([
            { $match: { storeId: store._id } },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ]),
        ]);
        return {
          ...store.toObject(),
          userCount,
          productCount,
          totalRevenue: salesTotal[0]?.total || 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET SINGLE STORE DETAILS
   GET /api/superadmin/stores/:id
───────────────────────────────────────────── */
export const getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("owner", "username email");
    if (!store) return res.status(404).json({ message: "Store not found" });

    const users    = await User.find({ storeId: store._id }).select("username role active lastLoginAt");
    const products = await Product.countDocuments({ storeId: store._id });

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const salesStats = await Sale.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: last30 } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    res.json({
      store,
      users,
      productCount: products,
      last30DaysSales:   salesStats[0]?.total || 0,
      last30DaysOrders:  salesStats[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   UPDATE STORE PLAN
   PUT /api/superadmin/stores/:id/plan
   Body: { plan, expiresAt, maxUsers, maxProducts }
───────────────────────────────────────────── */
export const updateStorePlan = async (req, res) => {
  try {
    const { plan, expiresAt, maxUsers, maxProducts } = req.body;
    const updates = {};
    if (plan)        updates.plan           = plan;
    if (expiresAt)   updates.planExpiresAt  = new Date(expiresAt);
    if (maxUsers)    updates.maxUsers       = maxUsers;
    if (maxProducts) updates.maxProducts    = maxProducts;

    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!store) return res.status(404).json({ message: "Store not found" });

    res.json({ message: "Plan updated", store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   TOGGLE STORE ACTIVE STATUS
   PUT /api/superadmin/stores/:id/toggle
───────────────────────────────────────────── */
export const toggleStoreActive = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    store.active = !store.active;
    await store.save();

    res.json({ message: `Store ${store.active ? "activated" : "deactivated"}`, active: store.active });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   PLATFORM STATS (for super admin dashboard)
   GET /api/superadmin/stats
───────────────────────────────────────────── */
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalStores,
      activeStores,
      totalUsers,
      totalProducts,
      revenueAgg,
    ] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ active: true }),
      User.countDocuments({ role: { $ne: "superadmin" } }),
      Product.countDocuments(),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    // Stores created per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const storeGrowth = await Store.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);

    // Plan distribution
    const planDist = await Store.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]);

    res.json({
      totalStores,
      activeStores,
      totalUsers,
      totalProducts,
      totalRevenue: revenueAgg[0]?.total || 0,
      storeGrowth,
      planDistribution: planDist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   CREATE SUPER ADMIN (one-time setup only)
   POST /api/superadmin/create
   Protected: only works if NO superadmin exists
───────────────────────────────────────────── */
export const createSuperAdmin = async (req, res) => {
  try {
    const exists = await User.findOne({ role: "superadmin" });
    if (exists) {
      return res.status(403).json({ message: "Super admin already exists" });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }

    const superAdmin = await User.create({ username, password, role: "superadmin" });
    res.status(201).json({ message: "Super admin created", id: superAdmin._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};