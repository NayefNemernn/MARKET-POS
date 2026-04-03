import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name:      String,
        price:     Number,
        cost:      { type: Number, default: 0 },
        quantity:  { type: Number, required: true },
        subtotal:  Number,
        // per-item discount
        discountAmount: { type: Number, default: 0 },
      },
    ],

    total:          { type: Number, required: true },
    subtotal:       { type: Number, default: 0 },
    taxAmount:      { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 }, // cart-level discount

    // ── Payment ──────────────────────────────────────────────
    // Primary method kept for backward compat
    paymentMethod: {
      type:    String,
      enum:    ["cash", "card", "paylater", "split"],
      default: "cash",
    },
    paid: { type: Boolean, default: true },

    // Split payment breakdown
    splitPayments: [
      {
        method: { type: String, enum: ["cash", "card", "paylater"] },
        amount: Number,
      },
    ],

    // ── Customer ─────────────────────────────────────────────
    customerName: { type: String, default: "" },
    customerId:   { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    phone:        { type: String, default: "" },
    notes:        { type: String, default: "" },

    // ── Return tracking ──────────────────────────────────────
    status: {
      type:    String,
      enum:    ["completed", "partially_returned", "fully_returned"],
      default: "completed",
    },
    returnedItems: [
      {
        productId:  mongoose.Schema.Types.ObjectId,
        name:       String,
        quantity:   Number,
        refundAmount: Number,
        reason:     String,
        returnedAt: { type: Date, default: Date.now },
        returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    totalRefunded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

saleSchema.index({ storeId: 1, createdAt: -1 });
saleSchema.index({ storeId: 1, status: 1 });

export default mongoose.model("Sale", saleSchema);