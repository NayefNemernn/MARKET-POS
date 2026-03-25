import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  customerName: String,
  phone: String,
  holdSaleId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  method: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Payment", paymentSchema);