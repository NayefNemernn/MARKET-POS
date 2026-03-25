/**
 * MIGRATION SCRIPT — run once after updating to multi-user isolation
 * Run: node src/migrate.js
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Sale from "./models/Sale.js";
import Category from "./models/Category.js";
import HoldSale from "./models/HoldSale.js";
import Payment from "./models/Payment.js";

const migrate = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log("✅ Connected:", mongoose.connection.name);

    // 1. Find admin
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.error("❌ No admin found. Run: node src/seedAdmin.js first");
      process.exit(1);
    }
    console.log(`👤 Admin: "${admin.username}" (${admin._id})`);

    // 2. Assign all orphan documents to admin
    const models = [
      { model: Product,  name: "Products"  },
      { model: Sale,     name: "Sales"     },
      { model: Category, name: "Categories"},
      { model: HoldSale, name: "HoldSales" },
      { model: Payment,  name: "Payments"  },
    ];

    for (const { model, name } of models) {
      const result = await model.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: admin._id } }
      );
      console.log(`📦 ${name} migrated: ${result.modifiedCount}`);
    }

    // 3. Drop ALL old indexes on products (global barcode unique)
    try {
      const productCol = mongoose.connection.collection("products");
      const indexes = await productCol.indexes();
      for (const idx of indexes) {
        // Drop any single-field barcode index (not compound with userId)
        if (idx.key && idx.key.barcode !== undefined && !idx.key.userId) {
          await productCol.dropIndex(idx.name);
          console.log(`🗑️  Dropped product index: ${idx.name}`);
        }
      }
    } catch (e) {
      console.warn("⚠️  Product index:", e.message);
    }

    // 4. Drop ALL old indexes on categories (global name unique)
    try {
      const categoryCol = mongoose.connection.collection("categories");
      const indexes = await categoryCol.indexes();
      for (const idx of indexes) {
        // Drop any single-field name index (not compound with userId)
        if (idx.key && idx.key.name !== undefined && !idx.key.userId) {
          await categoryCol.dropIndex(idx.name);
          console.log(`🗑️  Dropped category index: ${idx.name}`);
        }
      }
    } catch (e) {
      console.warn("⚠️  Category index:", e.message);
    }

    // 5. Rebuild correct compound indexes
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: true });
    await Product.syncIndexes();
    await Category.syncIndexes();
    console.log("🔧 Indexes rebuilt");

    console.log("\n✅ Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrate();