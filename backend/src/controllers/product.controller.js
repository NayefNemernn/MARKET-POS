import Product from "../models/Product.js";

/**
 * Add new product (admin)
 */
export const createProduct = async (req, res) => {
  try {
    const { name, barcode, price, stock, category } = req.body;

    const exists = await Product.findOne({ barcode });
    if (exists) {
      return res.status(400).json({ message: "Barcode already exists" });
    }

    const product = await Product.create({
      name,
      barcode,
      price,
      stock,
      category
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get product by barcode (POS scan)
 */
export const getByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all products
 */
export const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};
