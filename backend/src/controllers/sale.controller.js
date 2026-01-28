import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

/**
 * Create sale (checkout)
 */
export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;

    // Validate stock & calculate total
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`
        });
      }

      total += product.price * item.quantity;
    }

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    // Save sale
    const sale = await Sale.create({
      items,
      total,
      paymentMethod
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all sales (reports)
 */
export const getSales = async (req, res) => {
  const sales = await Sale.find().sort({ createdAt: -1 });
  res.json(sales);
};
