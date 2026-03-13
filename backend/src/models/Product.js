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

    // category relation
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },

    // ⭐ PRODUCT IMAGE
    image: {
      type: String,
      default: ""
    }

  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);