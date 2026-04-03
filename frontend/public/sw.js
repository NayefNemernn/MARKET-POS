/* ================================================================
   MARKET POS — Service Worker
   Strategy:
     App shell  → Cache First (always fast)
     API GET    → Stale-While-Revalidate (fast + fresh)
     API POST   → Network only (mutations must reach server)
   Background Sync → replay queued POST requests when online
================================================================ */

const CACHE_VERSION  = "v3";
const SHELL_CACHE    = `pos-shell-${CACHE_VERSION}`;
const API_CACHE      = `pos-api-${CACHE_VERSION}`;
const SYNC_TAG       = "pos-sync-sales";

/* ── App shell files to pre-cache ──────────────────────────── */
const SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/placeholder.png",
];

/* ── Install: pre-cache shell ───────────────────────────────── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_URLS).catch((err) => {
        console.warn("[SW] Shell pre-cache partial failure:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ────────────────────────────── */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: routing strategy ────────────────────────────────── */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  /* skip non-GET for API — let them go straight to network */
  if (request.method !== "GET") return;

  /* skip chrome-extension, data: URLs */
  if (!url.protocol.startsWith("http")) return;

  const isAPI      = url.pathname.startsWith("/api/");
  const isNavigation = request.mode === "navigate";

  /* ── Navigation: serve index.html from shell cache ── */
  if (isNavigation) {
    e.respondWith(
      caches.match("/index.html", { cacheName: SHELL_CACHE })
        .then((cached) => cached || fetch(request))
    );
    return;
  }

  /* ── Static assets: cache first ── */
  if (!isAPI) {
    e.respondWith(
      caches.match(request, { cacheName: SHELL_CACHE }).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => new Response("Offline", { status: 503 }));
      })
    );
    return;
  }

  /* ── API GET: stale-while-revalidate ── */
  e.respondWith(
    caches.open(API_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => null);

        return cached || fetchPromise || new Response(
          JSON.stringify({ error: "Offline", cached: false }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    )
  );
});

/* ── Background Sync ────────────────────────────────────────── */
self.addEventListener("sync", (e) => {
  if (e.tag === SYNC_TAG) {
    e.waitUntil(syncPendingSales());
  }
});

async function syncPendingSales() {
  /* Open IndexedDB and drain the queue */
  const db  = await openDB();
  const all = await getAllRecords(db, "pending_sales");

  for (const sale of all) {
    try {
      const { id, savedAt, ...saleData } = sale;
      const token = await getTokenFromDB(db);

      const response = await fetch("/api/sales", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        await deleteRecord(db, "pending_sales", id);
        /* notify all open clients */
        const clients = await self.clients.matchAll();
        clients.forEach((c) =>
          c.postMessage({ type: "SYNC_SALE_SUCCESS", sale: saleData })
        );
      }
    } catch (err) {
      console.error("[SW] Sync failed for sale:", err);
    }
  }
}

/* ── Message handler: manual sync trigger ───────────────────── */
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (e.data?.type === "TRIGGER_SYNC") {
    syncPendingSales().then(() => {
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) => c.postMessage({ type: "SYNC_COMPLETE" }))
      );
    });
  }
});

/* ── IndexedDB helpers ──────────────────────────────────────── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pos_offline_db", 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending_sales")) {
        db.createObjectStore("pending_sales", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("auth")) {
        db.createObjectStore("auth", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getAllRecords(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function deleteRecord(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

async function getTokenFromDB(db) {
  return new Promise((resolve) => {
    try {
      const tx  = db.transaction("auth", "readonly");
      const req = tx.objectStore("auth").get("token");
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror   = () => resolve(null);
    } catch { resolve(null); }
  });
}