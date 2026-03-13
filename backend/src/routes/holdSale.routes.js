import express from "express";

import {
  createHoldSale,
  getHoldSales,
  getHoldSaleNames,
  payHoldSale,
  updateHoldCustomer,
  deleteHoldSale,
  getRecentPayments,
  paymentsThisMonth,
  getCustomerPayments,
  getCustomerInvoices
} from "../controllers/holdSale.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createHoldSale);

router.get("/", getHoldSales);

router.get("/names", getHoldSaleNames);

router.post("/:id/pay", payHoldSale);

router.put("/:id/customer", updateHoldCustomer);

router.get("/payments/recent", getRecentPayments);

router.delete("/:id", deleteHoldSale);

router.get("/payments/recent",getRecentPayments);

router.get("/payments/month",paymentsThisMonth);

router.get("/payments/customer/:name", getCustomerPayments);
router.get("/invoices/:name", getCustomerInvoices);

export default router;