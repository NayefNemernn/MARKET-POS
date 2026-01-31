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
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
  return res.status(400).json({
    message: `${product.name} has insufficient stock`
  });
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
    }

    // Reduce stock (atomic updates)
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    const sale = await Sale.create({
      items: saleItems,
      total,
      paymentMethod
    });

    res.status(201).json({
      message: "Sale completed",
      sale
    });
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

/**
 * Get single sale (receipt)
 */
export const getSaleById = async (req, res) => {
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    return res.status(404).json({ message: "Sale not found" });
  }

  res.json(sale);
};
