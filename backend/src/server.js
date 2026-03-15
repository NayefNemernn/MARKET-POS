import app from "./app.js";
<<<<<<< HEAD
=======
import dotenv from "dotenv";
dotenv.config();
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
import { connectDB } from "./config/db.js";
import { PORT } from "./config/env.js";
import { fileURLToPath } from "url";

import express from "express";
import path from "path";

<<<<<<< HEAD
=======

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
const startServer = async () => {

  await connectDB();
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

  const port = process.env.PORT || PORT || 5000;

  /* SERVE PRODUCT IMAGES */
  app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../uploads"))
);

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

};

startServer();