import mongoose from "mongoose";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Category from "../models/Category.js";
import supabase from "../config/supabase.js";
import { v4 as uuid } from "uuid";

const storeFilter = (req) => ({ storeId: req.storeId });

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find(storeFilter(req))
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode,
      ...storeFilter(req),
    }).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const products = await Product.find(storeFilter(req)).populate("category", "name").lean();

    const lowStock = products
      .filter(p => p.stock <= 5)
      .map(p => ({ _id: p._id, name: p.name, image: p.image, stock: p.stock, category: p.category?.name || "", price: p.price, expiryDate: p.expiryDate || null }))
      .sort((a, b) => a.stock - b.stock);

    const expiring = products
      .filter(p => p.expiryDate)
      .map(p => {
        const exp = new Date(p.expiryDate);
        const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return { ...p, daysLeft };
      })
      .filter(p => p.daysLeft <= 30)
      .map(p => ({ _id: p._id, name: p.name, image: p.image, stock: p.stock, category: p.category?.name || "", price: p.price, expiryDate: p.expiryDate, daysLeft: p.daysLeft, expired: p.daysLeft < 0 }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    res.json({ lowStock, expiring });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfitabilityReport = async (req, res) => {
  try {
    const storeId = req.storeId;
    const products = await Product.find({ storeId }).select("name price cost stock image").lean();
    const productMap = {};
    products.forEach(p => { productMap[String(p._id)] = p; });

    const salesAgg = await Sale.aggregate([
      { $match: { storeId } },
      { $unwind: "$items" },
      {
        $group: {
          _id:       "$items.productId",
          name:      { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue:   { $sum: "$items.subtotal" },
          cogs:      { $sum: { $multiply: [{ $ifNull: ["$items.cost", 0] }, "$items.quantity"] } },
        }
      },
      { $sort: { revenue: -1 } },
    ]);

    const rows = salesAgg.map(row => {
      const prod    = productMap[String(row._id)] || {};
      const revenue = row.revenue || 0;
      const cogs    = row.cogs    || 0;
      const profit  = revenue - cogs;
      const margin  = revenue > 0 ? (profit / revenue) * 100 : 0;
      return { productId: row._id, name: row.name, image: prod.image || "", price: prod.price || 0, cost: prod.cost || 0, stock: prod.stock || 0, unitsSold: row.unitsSold, revenue: +revenue.toFixed(2), cogs: +cogs.toFixed(2), profit: +profit.toFixed(2), margin: +margin.toFixed(1) };
    });

    const totals = rows.reduce((acc, r) => ({ revenue: acc.revenue + r.revenue, cogs: acc.cogs + r.cogs, profit: acc.profit + r.profit, units: acc.units + r.unitsSold }), { revenue: 0, cogs: 0, profit: 0, units: 0 });
    const inventoryValue = products.reduce((s, p) => s + (p.cost || 0) * (p.stock || 0), 0);

    res.json({ rows, totals: { revenue: +totals.revenue.toFixed(2), cogs: +totals.cogs.toFixed(2), profit: +totals.profit.toFixed(2), margin: totals.revenue > 0 ? +((totals.profit / totals.revenue) * 100).toFixed(1) : 0, units: totals.units, inventoryValue: +inventoryValue.toFixed(2) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const productId      = new mongoose.Types.ObjectId(req.params.id);
    const storeId        = req.storeId;
    const thirtyDaysAgo  = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pipeline = (extraMatch) => [
      { $match: { storeId, ...extraMatch } },
      { $unwind: "$items" },
      { $match: { "items.productId": productId } },
      { $group: { _id: null, sold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
    ];

    const [allTime, last30] = await Promise.all([
      Sale.aggregate(pipeline({})),
      Sale.aggregate(pipeline({ createdAt: { $gte: thirtyDaysAgo } })),
    ]);

    res.json({
      allTime: { sold: allTime[0]?.sold || 0, revenue: allTime[0]?.revenue || 0 },
      last30:  { sold: last30[0]?.sold  || 0, revenue: last30[0]?.revenue  || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    // Check plan product limit
    const store = req.store;
    const count = await Product.countDocuments({ storeId: req.storeId });
    if (count >= store.maxProducts) {
      return res.status(403).json({ message: `Product limit (${store.maxProducts}) reached. Upgrade your plan.` });
    }

    const { name, barcode, price, cost, stock, category, expiryDate } = req.body;
    let imageUrl = "";

    if (req.file) {
      const fileName = `${uuid()}.jpg`;
      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (error) throw error;
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
    }

    const product = await Product.create({
      name, barcode, price, cost: cost || 0, stock,
      category, expiryDate: expiryDate || null,
      image:   imageUrl,
      storeId: req.storeId,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const fileName = `products/${uuid()}`;
      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (error) throw error;
      updateData.image = `${process.env.SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      updateData,
      { new: true }
    ).populate("category", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const importProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const store = req.store;
    const currentCount = await Product.countDocuments({ storeId: req.storeId });

    const XLSX     = await import("xlsx");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const allRows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const dataRows = allRows.slice(2).filter(r => String(r[0]).trim() || String(r[1]).trim());

    const catDocs = await Category.find({ storeId: req.storeId });
    const catMap  = {};
    catDocs.forEach(c => { catMap[c.name.toLowerCase()] = c._id; });

    let inserted = 0, skipped = 0;
    const errors = [];

    for (let i = 0; i < dataRows.length; i++) {
      if (currentCount + inserted >= store.maxProducts) {
        errors.push({ row: i + 3, reason: "Product limit reached" });
        break;
      }

      const row    = dataRows[i];
      const rowNum = i + 3;
      const barcode = String(row[0] || "").trim();
      const name    = String(row[1] || "").trim();

      if (!barcode || !name) { errors.push({ row: rowNum, reason: "Missing barcode or name" }); continue; }

      const exists = await Product.findOne({ barcode, storeId: req.storeId });
      if (exists) { skipped++; continue; }

      const price       = parseFloat(row[2]) || 0;
      const cost        = parseFloat(row[3]) || 0;
      const stock       = parseInt(row[4])   || 0;
      const categoryRaw = String(row[5] || "").trim().toLowerCase();
      const expiryRaw   = String(row[6] || "").trim();
      const imageUrl    = String(row[7] || "").trim();

      let categoryId = null;
      if (categoryRaw) {
        if (catMap[categoryRaw]) {
          categoryId = catMap[categoryRaw];
        } else {
          const newCat = await Category.create({ name: String(row[5]).trim(), storeId: req.storeId });
          catMap[categoryRaw] = newCat._id;
          categoryId = newCat._id;
        }
      }

      let expiryDate = null;
      if (expiryRaw.match(/\d{4}-\d{2}-\d{2}/)) expiryDate = new Date(expiryRaw);

      await Product.create({ name, barcode, price, cost, stock, category: categoryId, expiryDate, image: imageUrl || "", storeId: req.storeId });
      inserted++;
    }

    res.json({ message: `Import done: ${inserted} added, ${skipped} skipped, ${errors.length} errors`, inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};