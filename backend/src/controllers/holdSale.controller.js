import HoldSale from "../models/HoldSale.js";

/* =========================
   CREATE OR UPDATE HOLD SALE
========================= */
export const createOrUpdateHoldSale = async (req, res) => {
  const { customerName, items, total } = req.body;

  if (!customerName || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid hold sale data" });
  }

  let sale = await HoldSale.findOne({ customerName });

  if (sale) {
    items.forEach((newItem) => {
      const existing = sale.items.find(
        (i) => i.productId.toString() === newItem.productId
      );

      if (existing) {
        existing.quantity += newItem.quantity;
      } else {
        sale.items.push(newItem);
      }
    });

    sale.total += total;
    await sale.save();
    return res.json(sale);
  }

  const newSale = await HoldSale.create({
    customerName,
    items,
    total
  });

  res.status(201).json(newSale);
};

/* =========================
   GET ALL HOLD SALES
========================= */
export const getHoldSales = async (req, res) => {
  const sales = await HoldSale.find().sort({ createdAt: -1 });
  res.json(sales);
};

/* =========================
   GET DISTINCT CUSTOMER NAMES ✅
========================= */
export const getHoldSaleNames = async (req, res) => {
  const names = await HoldSale.distinct("customerName");
  res.json(names);
};

/* =========================
   DELETE HOLD SALE
========================= */
export const deleteHoldSale = async (req, res) => {
  await HoldSale.findByIdAndDelete(req.params.id);
  res.json({ message: "Hold sale removed" });
};
