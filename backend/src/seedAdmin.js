import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";

const MONGO_URI = process.env.MONGO_URI;

const seed = async () => {
  try {
    console.log("Using URI:", MONGO_URI);

    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB:", mongoose.connection.name);

    const hashedPassword = await bcrypt.hash("123456", 10);

    await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    console.log("✅ Admin created");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seed();