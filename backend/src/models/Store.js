import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────
    name:       { type: String, required: true, trim: true },
    slug:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo:       { type: String, default: "" },

    // ── Owner (the admin who created/owns this store) ─────────
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // ── Business Info ─────────────────────────────────────────
    address:    { type: String, default: "" },
    phone:      { type: String, default: "" },
    email:      { type: String, default: "" },
    taxNumber:  { type: String, default: "" },

    // ── Settings ─────────────────────────────────────────────
    currency:       { type: String, default: "USD" },
    currencySymbol: { type: String, default: "$" },
    taxRate:        { type: Number, default: 0, min: 0, max: 100 }, // percentage
    language:       { type: String, default: "en" },
    theme:          { type: String, default: "light" },
    receiptFooter:  { type: String, default: "" },

    // ── Subscription / Plan ───────────────────────────────────
    plan: {
      type:    String,
      enum:    ["trial", "basic", "pro", "enterprise"],
      default: "trial",
    },
    planExpiresAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14-day trial
    maxUsers:      { type: Number, default: 2 },  // cashiers allowed
    maxProducts:   { type: Number, default: 100 },

    // ── Status ────────────────────────────────────────────────
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug from name if not provided
storeSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40);
  }
  next();
});

export default mongoose.model("Store", storeSchema);