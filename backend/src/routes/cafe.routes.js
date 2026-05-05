import express from "express";
import { protectCafe, isCafeManager } from "../middleware/cafeAuth.middleware.js";
import { cafeStaffLogin, getCafeStaffMe } from "../controllers/cafeAuth.controller.js";
import {
  getTables, createTable, updateTable, deleteTable, updateTableStatus,
  getCafeMenuItems, createCafeMenuItem, updateCafeMenuItem, deleteCafeMenuItem,
  getOrders, getOrder, openOrder, addItems, updateItem, cancelItem,
  sendToKitchen, updateOrderMeta, checkoutOrder, transferItems, mergeOrders, cancelOrder,
  getKitchenOrders, updateItemStatus,
  getReservations, createReservation, updateReservation, seatReservation, cancelReservation,
  getCafeReports,
} from "../controllers/cafe.controller.js";

const router = express.Router();

/* ── Public auth routes (no token needed) ── */
router.post("/auth/login", cafeStaffLogin);

/* ── All routes below require valid token (café staff or main-POS user) ── */
router.use(protectCafe);

router.get("/auth/me", getCafeStaffMe);

// Menu items
router.get("/menu",              getCafeMenuItems);
router.post("/menu",             isCafeManager, createCafeMenuItem);
router.put("/menu/:id",          isCafeManager, updateCafeMenuItem);
router.delete("/menu/:id",       isCafeManager, deleteCafeMenuItem);

// Tables
router.get("/tables",              getTables);
router.post("/tables",             isCafeManager, createTable);
router.put("/tables/:id",          isCafeManager, updateTable);
router.delete("/tables/:id",       isCafeManager, deleteTable);
router.put("/tables/:id/status",   updateTableStatus);

// Orders
router.get("/orders",              getOrders);
router.get("/orders/:id",          getOrder);
router.post("/orders",             openOrder);
router.post("/orders/:id/items",   addItems);
router.put("/orders/:id/items/:itemId",    updateItem);
router.delete("/orders/:id/items/:itemId", cancelItem);
router.post("/orders/:id/send-to-kitchen", sendToKitchen);
router.put("/orders/:id/meta",     updateOrderMeta);
router.post("/orders/:id/checkout", checkoutOrder);
router.post("/orders/transfer",    transferItems);
router.post("/orders/merge",       mergeOrders);
router.delete("/orders/:id",       isCafeManager, cancelOrder);

// Kitchen
router.get("/kitchen",             getKitchenOrders);
router.put("/kitchen/:orderId/items/:itemId/status", updateItemStatus);

// Reservations
router.get("/reservations",        getReservations);
router.post("/reservations",       createReservation);
router.put("/reservations/:id",    updateReservation);
router.post("/reservations/:id/seat", seatReservation);
router.delete("/reservations/:id", cancelReservation);

// Reports
router.get("/reports",             isCafeManager, getCafeReports);

export default router;
