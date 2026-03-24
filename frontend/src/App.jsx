import React, { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";
import PayLater from "./pages/PayLater";
import useOfflineSales from "./hooks/useOfflineSales";

export default function App() {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user"));

  const [page, setPage]       = useState(user?.role === "admin" ? "dashboard" : "pos");
  const [isOnline, setIsOnline] = useState(true); // default true — don't scare users on load
  const [installPrompt, setInstallPrompt] = useState(null); // PWA install event
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const { sync } = useOfflineSales();

  // ── PWA install prompt ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();          // stop browser's default mini-infobar
      setInstallPrompt(e);         // save event so we can fire it manually
      setShowInstallBanner(true);  // show our custom install banner
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("✅ App installed! You can now open it from your desktop.");
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // ── Online / offline detection + auto-sync ─────────────────────────────────
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const toastId = toast.loading("Syncing offline sales...");
      const { synced, failed } = await sync();
      toast.dismiss(toastId);
      if (synced > 0) toast.success(`✅ ${synced} offline sale(s) synced!`);
      if (failed > 0) toast.error(`⚠️ ${failed} sale(s) failed to sync`);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("📴 You're offline — sales will be saved locally", {
        icon: "⚠️",
        duration: 4000,
      });
    };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Role guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      user?.role !== "admin" &&
      ["dashboard", "products", "categories", "users", "reports"].includes(page)
    ) {
      setPage("pos");
    }
  }, [page, user?.role]);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!token || !user) {
    return (
      <AuthProvider>
        <Toaster position="top-right" />
        <Login />
      </AuthProvider>
    );
  }

  // ── Page router ───────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "dashboard":  return <Dashboard setPage={setPage} />;
      case "pos":        return <POS setPage={setPage} user={user} />;
      case "products":   return <Products />;
      case "categories": return <Categories />;
      case "users":      return <Users />;
      case "reports":    return <Reports />;
      case "paylater":   return <PayLater />;
      default:           return <POS />;
    }
  };

  return (
    <AuthProvider>
      <Toaster position="top-right" />

      {/* ── Offline banner ──────────────────────────────────────────────── */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center text-sm py-1 font-semibold">
          ⚠️ Offline Mode — Sales are being saved locally
        </div>
      )}

      {/* ── Install banner ──────────────────────────────────────────────── */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1c1c1c] text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
          <span className="text-sm">📲 Install Market POS as a desktop app</span>
          <button
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-xl transition"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <DashboardLayout page={page} setPage={setPage} user={user}>
        {renderPage()}
      </DashboardLayout>
    </AuthProvider>
  );
}