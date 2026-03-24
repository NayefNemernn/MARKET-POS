import { createSale } from "../api/sale.api";

const DB_NAME = "pos_offline_db";
const STORE_NAME = "pending_sales";

// ── Open / create IndexedDB ──────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export default function useOfflineSales() {

  /** Save one sale to IndexedDB when offline */
  const saveOffline = async (sale) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add({
        ...sale,
        savedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror   = () => reject(tx.error);
    });
  };

  /** Get all pending offline sales */
  const getPending = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  };

  /** Delete a single synced sale from IndexedDB */
  const deleteSale = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror   = () => reject(tx.error);
    });
  };

  /** How many sales are waiting to sync */
  const getPendingCount = async () => {
    const pending = await getPending();
    return pending.length;
  };

  /**
   * Push all pending sales to the server.
   * Each sale is tried independently — one failure won't block others.
   */
  const sync = async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    const pending = await getPending();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const sale of pending) {
      try {
        const { id, savedAt, ...saleData } = sale; // strip IndexedDB meta fields
        await createSale(saleData);
        await deleteSale(id);
        synced++;
      } catch (err) {
        console.error("Failed to sync offline sale:", err);
        failed++;
      }
    }

    return { synced, failed };
  };

  return { saveOffline, sync, getPendingCount };
}