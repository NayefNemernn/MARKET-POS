import Product from "../models/Product.js";

/**
 * Get all products
 */
export const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

/**
 * Get product by barcode
 */
export const getProductByBarcode = async (req, res) => {
  const product = await Product.findOne({
    barcode: req.params.barcode
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

/**
 * Create new product (admin)
 */
export const createProduct = async (req, res) => {
  const { name, barcode, price, stock } = req.body;

  const exists = await Product.findOne({ barcode });
  if (exists) {
    return res.status(400).json({ message: "Barcode already exists" });
  }

  const product = await Product.create({
    name,
    barcode,
    price,
    stock
  });

  res.status(201).json(product);
};

/**
 * Update product (admin)
 */
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

/**
 * Delete product (admin)
 */
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted" });
};
