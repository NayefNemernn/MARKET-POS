import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod, customerName, notes } = req.body;
    const storeId = req.storeId;
    const taxRate = req.store?.taxRate || 0;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, storeId });
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `${product.name} - not enough stock` });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      saleItems.push({
        productId: product._id,
        name:      product.name,
        price:     product.price,
        cost:      product.cost || 0,
        quantity:  item.quantity,
        subtotal:  itemSubtotal,
      });

      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
    const total     = +(subtotal + taxAmount).toFixed(2);

    const sale = await Sale.create({
      storeId,
      userId:        req.user._id,
      items:         saleItems,
      total,
      taxAmount,
      paymentMethod,
      paid:          paymentMethod !== "paylater",
      customerName:  customerName || "",
      notes:         notes || "",
    });

    res.status(201).json({ message: "Sale completed", sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ storeId: req.storeId })
      .sort({ createdAt: -1 })
      .populate("userId", "username");
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};