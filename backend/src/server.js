import app from "./app.js";
import { connectDB } from "./config/db.js";
import { PORT } from "./config/env.js";

import express from "express";
import path from "path";

const startServer = async () => {

  await connectDB();

  const port = process.env.PORT || PORT || 5000;

  /* SERVE PRODUCT IMAGES */
  app.use("/uploads", express.static(path.join(process.cwd(),"backend/uploads")));

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

};

startServer();