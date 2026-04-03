import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    storeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    username: { type: String },

    openedAt:  { type: Date, default: Date.now },
    closedAt:  { type: Date, default: null },

    openingFloat:  { type: Number, default: 0 },  // cash put in drawer at start
    closingCount:  { type: Number, default: null }, // cash counted at end
    expectedCash:  { type: Number, default: 0 },   // calculated from sales
    variance:      { type: Number, default: null }, // closingCount - expectedCash

    // snapshot of sales during this shift
    totalSales:    { type: Number, default: 0 },
    totalOrders:   { type: Number, default: 0 },
    cashSales:     { type: Number, default: 0 },
    cardSales:     { type: Number, default: 0 },
    payLaterSales: { type: Number, default: 0 },
    totalRefunds:  { type: Number, default: 0 },
    netRevenue:    { type: Number, default: 0 },

    notes:  { type: String, default: "" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

shiftSchema.index({ storeId: 1, status: 1 });
shiftSchema.index({ storeId: 1, openedAt: -1 });

export default mongoose.model("Shift", shiftSchema);