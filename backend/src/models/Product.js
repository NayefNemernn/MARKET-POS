import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    barcode: {
      type: String,
      required: true,
      unique: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },

    // 🔗 REAL RELATION
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
