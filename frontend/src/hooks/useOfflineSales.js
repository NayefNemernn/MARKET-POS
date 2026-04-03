import { useEffect, useCallback, useRef } from "react";
import { createSale } from "../api/sale.api";
import { returnSale  } from "../api/sale.api";
import {
  queueSale, getPendingSales, deletePendingSale, getPendingSaleCount,
  queueReturn, getPendingReturns, deletePendingReturn,
  saveToken,
} from "../lib/offlineDB";
import toast from "react-hot-toast";

export default function useOfflineSales() {

  /* ── keep auth token synced into IDB for SW background sync ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) saveToken(token).catch(() => {});
  }, []);

  /* ── listen for SW messages (background sync success) ──────── */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (e) => {
      if (e.data?.type === "SYNC_SALE_SUCCESS") {
        toast.success("✅ Offline sale synced!");
        window.dispatchEvent(new Event("offlineSynced"));
      }
      if (e.data?.type === "SYNC_COMPLETE") {
        window.dispatchEvent(new Event("offlineSynced"));
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  /* ── saveOffline: queue a sale to IndexedDB ─────────────────── */
  const saveOffline = useCallback(async (saleData) => {
    await queueSale(saleData);

    /* Try to register a background sync (Chrome/Android) */
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register("pos-sync-sales");
      } catch { /* SyncManager not always available */ }
    }
  }, []);

  /* ── saveReturnOffline: queue a return ──────────────────────── */
  const saveReturnOffline = useCallback(async (saleId, returnData) => {
    await queueReturn({ saleId, ...returnData });
  }, []);

  /* ── getPendingCount ────────────────────────────────────────── */
  const getPendingCount = useCallback(async () => {
    const sales   = await getPendingSaleCount();
    const returns = (await getPendingReturns()).length;
    return sales + returns;
  }, []);

  /* ── sync: manual drain of both queues ─────────────────────── */
  const sync = useCallback(async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    /* sync pending sales */
    const pendingSales = await getPendingSales();
    for (const sale of pendingSales) {
      try {
        const { id, savedAt, ...saleData } = sale;
        await createSale(saleData);
        await deletePendingSale(id);
        synced++;
      } catch (err) {
        console.error("[Sync] Sale failed:", err.response?.data || err.message);
        failed++;
      }
    }

    /* sync pending returns */
    const pendingReturns = await getPendingReturns();
    for (const ret of pendingReturns) {
      try {
        const { id, savedAt, saleId, ...returnData } = ret;
        await returnSale(saleId, returnData);
        await deletePendingReturn(id);
        synced++;
      } catch (err) {
        console.error("[Sync] Return failed:", err.response?.data || err.message);
        failed++;
      }
    }

    return { synced, failed };
  }, []);

  return { saveOffline, saveReturnOffline, sync, getPendingCount };
}