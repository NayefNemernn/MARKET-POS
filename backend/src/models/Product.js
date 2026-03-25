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
      required: true
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    image: {
      type: String,
      default: ""
    },
    // Data isolation per user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// barcode unique per user
productSchema.index({ barcode: 1, userId: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);