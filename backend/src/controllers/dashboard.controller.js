import Sale from "../models/Sale.js";

// DAILY REPORT
export const getDailySales = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Sale.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    res.json(result[0] || { totalSales: 0, totalRevenue: 0 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getMonthlySales = async (req, res) => {
  try {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Sale.aggregate([
      { $match: { createdAt: { $gte: startMonth } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    res.json(result[0] || { totalSales: 0, totalRevenue: 0 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getYearlySales = async (req, res) => {
  try {
    const now = new Date();
    const startYear = new Date(now.getFullYear(), 0, 1);

    const result = await Sale.aggregate([
      { $match: { createdAt: { $gte: startYear } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    res.json(result[0] || { totalSales: 0, totalRevenue: 0 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};