import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

export const getDashboardStats = async (req, res) => {
  try {
    const storeId = req.storeId;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [today, totalProducts, lowStockProducts, recentSales, salesChart, topProducts] = await Promise.all([
      Sale.aggregate([
        { $match: { storeId, createdAt: { $gte: start } } },
        { $group: { _id: null, todaySales: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ storeId }),
      Product.find({ storeId, stock: { $lte: 5 } }).select("name stock").limit(5),
      Sale.find({ storeId }).sort({ createdAt: -1 }).limit(5).select("total customerName createdAt"),
      Sale.aggregate([
        { $match: { storeId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dayOfMonth: "$createdAt" }, sales: { $sum: "$total" } } },
        { $sort: { _id: 1 } },
      ]),
      Sale.aggregate([
        { $match: { storeId } },
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", sold: { $sum: "$items.quantity" }, name: { $first: "$items.name" } } },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      todaySales:       today[0]?.todaySales || 0,
      todayOrders:      today[0]?.count || 0,
      totalProducts,
      lowStock:         lowStockProducts.length,
      lowStockProducts,
      recentSales,
      salesChart:       salesChart.map(s => ({ day: s._id, sales: s.sales })),
      topProducts:      topProducts.map(p => ({ _id: p._id, name: p.name, sold: p.sold })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};