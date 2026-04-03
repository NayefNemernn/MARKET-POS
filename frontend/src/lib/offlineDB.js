/* ================================================================
   offlineDB.js  —  Central IndexedDB manager for Market POS
   
   Stores:
     pending_sales     → queued sales waiting to sync
     pending_returns   → queued returns waiting to sync
     products_cache    → cached product list for offline POS
     categories_cache  → cached categories
     auth              → JWT token for SW background sync
================================================================ */

const DB_NAME    = "pos_offline_db";
const DB_VERSION = 2;

/* ── open / migrate ─────────────────────────────────────────── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("pending_sales")) {
        db.createObjectStore("pending_sales",   { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("pending_returns")) {
        db.createObjectStore("pending_returns", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("products_cache")) {
        db.createObjectStore("products_cache",  { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("categories_cache")) {
        db.createObjectStore("categories_cache",{ keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("auth")) {
        db.createObjectStore("auth",            { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/* ── generic helpers ────────────────────────────────────────── */
async function put(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(record);
    req.onsuccess = () => resolve(req.result);
    tx.onerror    = () => reject(tx.error);
  });
}

async function add(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).add(record);
    req.onsuccess = () => resolve(req.result);
    tx.onerror    = () => reject(tx.error);
  });
}

async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function getOne(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function remove(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

/* ── Auth token (kept in IDB so SW can read it) ─────────────── */
export async function saveToken(token) {
  await put("auth", { key: "token", value: token });
}

export async function clearToken() {
  await remove("auth", "token");
}

/* ── Products cache ─────────────────────────────────────────── */
export async function cacheProducts(products) {
  await put("products_cache", { key: "list", data: products, cachedAt: Date.now() });
}

export async function getCachedProducts() {
  const rec = await getOne("products_cache", "list");
  return rec?.data ?? null;
}

/* ── Categories cache ───────────────────────────────────────── */
export async function cacheCategories(categories) {
  await put("categories_cache", { key: "list", data: categories, cachedAt: Date.now() });
}

export async function getCachedCategories() {
  const rec = await getOne("categories_cache", "list");
  return rec?.data ?? null;
}

/* ── Pending sales ──────────────────────────────────────────── */
export async function queueSale(saleData) {
  return add("pending_sales", { ...saleData, savedAt: new Date().toISOString() });
}

export async function getPendingSales() {
  return getAll("pending_sales");
}

export async function deletePendingSale(id) {
  return remove("pending_sales", id);
}

export async function getPendingSaleCount() {
  const all = await getPendingSales();
  return all.length;
}

/* ── Pending returns ────────────────────────────────────────── */
export async function queueReturn(returnData) {
  return add("pending_returns", { ...returnData, savedAt: new Date().toISOString() });
}

export async function getPendingReturns() {
  return getAll("pending_returns");
}

export async function deletePendingReturn(id) {
  return remove("pending_returns", id);
}