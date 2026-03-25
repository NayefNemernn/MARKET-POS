import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

// Create sale (checkout) — user-scoped
export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId });
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `${product.name} not enough stock` });
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      saleItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });

      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const sale = await Sale.create({
      userId,
      items: saleItems,
      total,
      paymentMethod,
      paid: paymentMethod === "paylater" ? false : true
    });

    res.status(201).json({ message: "Sale completed", sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all sales — user-scoped
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single sale (receipt) — user-scoped
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, userId: req.user._id });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};