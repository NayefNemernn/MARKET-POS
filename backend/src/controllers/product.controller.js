import Product from "../models/Product.js";
import Category from "../models/Category.js";

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.json(products);
};

// GET PRODUCT BY BARCODE (POS)
export const getProductByBarcode = async (req, res) => {
  const product = await Product.findOne({
    barcode: req.params.barcode
  }).populate("category", "name");

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  const { name, barcode, price, stock, category } = req.body;

  const catExists = await Category.findById(category);
  if (!catExists) {
    return res.status(400).json({ message: "Invalid category" });
  }

  const product = await Product.create({
    name,
    barcode,
    price,
    stock,
    category
  });

  res.status(201).json(product);
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).populate("category", "name");

  res.json(product);
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};
