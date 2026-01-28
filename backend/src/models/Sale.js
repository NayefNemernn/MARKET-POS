import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true
        },
        subtotal: Number
      }
    ],
    total: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash"
    }
  },
  { timestamps: true }
);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
