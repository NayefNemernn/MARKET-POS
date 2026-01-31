import express from "express";
import {
  createOrUpdateHoldSale,
  getHoldSales,
  getHoldSaleNames,
  deleteHoldSale
} from "../controllers/holdSale.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrUpdateHoldSale);
router.get("/", getHoldSales);
router.get("/names", getHoldSaleNames);
router.delete("/:id", deleteHoldSale);

export default router;
