import mongoose from "mongoose";

const holdSaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number
      }
    ],
    total: Number
  },
  { timestamps: true }
);

export default mongoose.model("HoldSale", holdSaleSchema);
