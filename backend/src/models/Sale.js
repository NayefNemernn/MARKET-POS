import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    // ── Multi-tenancy ─────────────────────────────────────────
    storeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Store",
      required: true,
    },

    // Which cashier/admin processed this sale
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name:      String,
        price:     Number,
        cost:      { type: Number, default: 0 },
        quantity:  { type: Number, required: true },
        subtotal:  Number,
      },
    ],

    total:         { type: Number, required: true },
    taxAmount:     { type: Number, default: 0 },
    discountAmount:{ type: Number, default: 0 },

    paymentMethod: {
      type:    String,
      enum:    ["cash", "card", "paylater"],
      default: "cash",
    },
    paid: { type: Boolean, default: true },

    // Optional: customer reference
    customerName: { type: String, default: "" },
    notes:        { type: String, default: "" },
  },
  { timestamps: true }
);

saleSchema.index({ storeId: 1, createdAt: -1 });

export default mongoose.model("Sale", saleSchema);