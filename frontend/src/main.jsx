import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider }    from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { UIScaleProvider }  from "./context/UIScaleContext";
import "./index.css";
import { saveToken } from "./lib/offlineDB";

/* ── Service Worker registration ───────────────────────────── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (import.meta.env.DEV) {
        /* In dev mode: unregister all SWs so Vite HMR and Ctrl+R work normally */
        for (const reg of registrations) await reg.unregister();
        return;
      }

      /* Unregister any stale SWs from vite-plugin-pwa dev builds */
      for (const reg of registrations) {
        const swUrl = reg.active?.scriptURL || reg.installing?.scriptURL || "";
        if (!swUrl.endsWith("/sw.js")) await reg.unregister();
      }

      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[SW] Registered:", reg.scope);

      /* Tell new SW to activate immediately */
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        newSW?.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            newSW.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (err) {
      console.warn("[SW] Registration failed:", err);
    }
  });

  /* Reload page when a new SW takes control (seamless update) */
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}

/* ── Keep auth token in IDB for SW background sync ─────────── */
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  originalSetItem(key, value);
  if (key === "token") saveToken(value).catch(() => {});
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIScaleProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </UIScaleProvider>
  </React.StrictMode>
);