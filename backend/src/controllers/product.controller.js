import Product from "../models/Product.js";
import supabase from "../config/supabase.js";
import { v4 as uuid } from "uuid";

/* =========================
   GET ALL PRODUCTS (user-scoped)
========================= */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET PRODUCT BY BARCODE (user-scoped)
========================= */
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode,
      userId: req.user._id
    }).populate("category", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   CREATE PRODUCT (user-scoped)
========================= */
export const createProduct = async (req, res) => {
  try {
    const { name, barcode, price, stock, category } = req.body;
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
      name, barcode, price, stock, category,
      image: imageUrl,
      userId: req.user._id
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   UPDATE PRODUCT (user-scoped)
========================= */
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
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    ).populate("category", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE PRODUCT (user-scoped)
========================= */
export const deleteProduct = async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};