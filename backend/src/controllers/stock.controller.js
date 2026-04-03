import Product  from "../models/Product.js";
import StockLog from "../models/StockLog.js";
import AuditLog from "../models/AuditLog.js";

async function audit(req, action, description, meta = {}) {
  try {
    await AuditLog.create({ storeId: req.storeId, userId: req.user._id, username: req.user.username, action, description, meta });
  } catch {}
}

/* POST /api/stock/adjust
   Body: { productId, change, reason, type }
   type: "manual_add" | "manual_remove" | "adjustment"
*/
export const adjustStock = async (req, res) => {
  try {
    const { productId, change, reason = "", type = "adjustment" } = req.body;
    if (!productId) return res.status(400).json({ message: "productId required" });
    if (change === 0 || isNaN(change)) return res.status(400).json({ message: "change must be non-zero number" });

    const product = await Product.findOne({ _id: productId, storeId: req.storeId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newStock = product.stock + Number(change);
    if (newStock < 0) return res.status(400).json({ message: "Stock cannot go below zero" });

    await StockLog.create({
      storeId:        req.storeId,
      productId:      product._id,
      userId:         req.user._id,
      productName:    product.name,
      type,
      quantityBefore: product.stock,
      change:         Number(change),
      quantityAfter:  newStock,
      reason,
    });

    product.stock = newStock;
    await product.save();

    await audit(req, "stock_adjusted",
      `Stock adjusted: ${product.name} ${change > 0 ? "+" : ""}${change} (reason: ${reason || "none"})`,
      { productId, change, newStock, reason }
    );

    res.json({ message: "Stock adjusted", product });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* GET /api/stock/logs?productId=xxx */
export const getStockLogs = async (req, res) => {
  try {
    const filter = { storeId: req.storeId };
    if (req.query.productId) filter.productId = req.query.productId;
    const logs = await StockLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "username");
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};