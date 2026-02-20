import app from "./app.js";
import { connectDB } from "./config/db.js";
import { PORT } from "./config/env.js";

const startServer = async () => {
  await connectDB();

  const port = process.env.PORT || PORT || 5000;

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
};

startServer();