import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    await Category.deleteMany();

    const categories = [
      { name: "Food & Grocery", nameAr: "المواد الغذائية" },
      { name: "Bakery", nameAr: "المخبوزات" },
      { name: "Beverages", nameAr: "المشروبات" },
      { name: "Snacks", nameAr: "الوجبات الخفيفة" },
      { name: "Frozen", nameAr: "المجمدات" },
      { name: "Household", nameAr: "مواد تنظيف" },
      { name: "Personal Care", nameAr: "عناية شخصية" },
      { name: "Baby", nameAr: "مستلزمات أطفال" },
      { name: "Pet", nameAr: "مستلزمات حيوانات" },
      { name: "Health", nameAr: "الصحة" }
    ];

    await Category.insertMany(categories);

    console.log("✅ Categories seeded successfully!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedCategories();