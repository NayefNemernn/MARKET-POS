import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true // lets you test PWA in dev mode (localhost)
      },
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Market POS",
        short_name: "Market POS",
        description: "Point of Sale System",
        theme_color: "#141414",
        background_color: "#0b0b0b",
        display: "standalone",       // no browser bar = feels like a real app
        orientation: "landscape",    // good for POS desktops
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        // Cache all app shell assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Cache API responses so they work offline
        runtimeCaching: [
          {
            // Products — cache first, update in background
            urlPattern: ({ url }) => url.pathname.includes("/api/products"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-products",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            // Categories
            urlPattern: ({ url }) => url.pathname.includes("/api/categories"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-categories",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            // Supabase product images
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler: "CacheFirst",
            options: {
              cacheName: "product-images",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      }
    })
  ]
});