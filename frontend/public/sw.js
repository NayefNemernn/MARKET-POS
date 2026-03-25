const CACHE_NAME = "market-pos-v3";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // ✅ Never intercept API calls (cross-origin backend)
  const isApiCall =
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("onrender.com") ||
    url.hostname.includes("railway.app") ||
    url.hostname.includes("render.com") ||
    url.hostname.includes("fly.dev") ||
    url.hostname.includes("herokuapp.com");

  if (isApiCall) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (
            res.status === 200 &&
            (url.pathname.includes("/products") || url.pathname.includes("/categories"))
          ) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Supabase images — cache first
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Static assets — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});