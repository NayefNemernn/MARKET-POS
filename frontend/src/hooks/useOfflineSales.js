import { createSale } from "../api/sale.api";

const DB_NAME = "pos_offline_db";
const STORE_NAME = "pending_sales";

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

export default function useOfflineSales() {

  const saveOffline = async (sale) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add({
        ...sale,
        savedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => {
        console.log("✅ Sale saved offline:", sale);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  };

  const getPending = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  };

  const deleteSale = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  };

  const getPendingCount = async () => {
    const pending = await getPending();
    return pending.length;
  };

  const sync = async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    const pending = await getPending();
    console.log(`🔄 Syncing ${pending.length} offline sales...`, pending);

    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const sale of pending) {
      try {
        // Strip IndexedDB meta fields before sending
        const { id, savedAt, ...saleData } = sale;

        console.log("📤 Sending sale to server:", saleData);

        const result = await createSale(saleData);

        console.log("✅ Sale synced:", result);

        await deleteSale(id);
        synced++;
      } catch (err) {
        console.error("❌ Failed to sync sale:", err.response?.data || err.message);
        failed++;
      }
    }

    return { synced, failed };
  };

  return { saveOffline, sync, getPendingCount };
}