import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";
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

const ADMIN_PAGES = ["dashboard", "users"];

function AppInner() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const defaultPage = user?.role === "admin" ? "dashboard" : "pos";
  const [page, setPage] = useState(defaultPage);
  const [isOnline, setIsOnline] = useState(true);
  const { sync } = useOfflineSales();

  useEffect(() => {
    if (user?.role !== "admin" && ADMIN_PAGES.includes(page)) setPage("pos");
  }, [page, user?.role]);

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
      toast("📴 You're offline — sales will be saved locally", { icon: "⚠️", duration: 4000 });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!token || !user) return <Login />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":  return user?.role === "admin" ? <Dashboard setPage={setPage} /> : <POS setPage={setPage} user={user} />;
      case "pos":        return <POS setPage={setPage} user={user} />;
      case "products":   return <Products />;
      case "categories": return <Categories />;
      case "users":      return user?.role === "admin" ? <Users /> : <POS setPage={setPage} user={user} />;
      case "reports":    return <Reports />;
      case "paylater":   return <PayLater />;
      default:           return <POS setPage={setPage} user={user} />;
    }
  };

  return (
    <RefreshProvider>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-black text-center text-sm py-1 font-semibold">
          ⚠️ Offline Mode — Sales are being saved locally
        </div>
      )}
      <DashboardLayout page={page} setPage={setPage} user={user}>
        {renderPage()}
      </DashboardLayout>
    </RefreshProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppInner />
    </AuthProvider>
  );
}