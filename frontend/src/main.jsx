import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import "./index.css";

// Register our service worker and clean up any stale ones
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Unregister any old SW registrations (e.g. from vite-plugin-pwa dev builds)
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const swUrl = reg.active?.scriptURL || reg.installing?.scriptURL || "";
        // Kill anything that isn't our own sw.js
        if (!swUrl.includes("/sw.js")) {
          await reg.unregister();
        }
      }
      // Register our own SW
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (err) {
      console.warn("SW registration failed:", err);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);