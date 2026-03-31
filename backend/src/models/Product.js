import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    barcode:    { type: String, required: true },
    price:      { type: Number, required: true, min: 0 },
    cost:       { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, default: null },
    stock:      { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Category",
    },
    image: { type: String, default: "" },

    // ── Multi-tenancy: scoped to store ────────────────────────
    storeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Store",
      required: true,
    },
  },
  { timestamps: true }
);

// Barcode must be unique per store (not globally)
productSchema.index({ barcode: 1, storeId: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);