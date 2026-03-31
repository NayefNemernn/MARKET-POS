import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard     from "./pages/Dashboard";
import POS           from "./pages/POS";
import Products      from "./pages/Products";
import Categories    from "./pages/Categories";
import Reports       from "./pages/Reports";
import Users         from "./pages/Users";
import AdminPanel    from "./pages/AdminPanel";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import PayLater      from "./pages/PayLater";
import StoreSettings from "./pages/StoreSettings";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import useOfflineSales from "./hooks/useOfflineSales";

const ADMIN_PAGES = ["dashboard", "users", "adminpanel", "storesettings"];

function AppInner() {
  const { user, store, planExpired, daysUntilExpiry } = useAuth();
  const token = localStorage.getItem("token");

  const defaultPage = user?.role === "admin" ? "dashboard" : "pos";
  const [page,          setPage]          = useState(defaultPage);
  const [showRegister,  setShowRegister]  = useState(false);
  const [isOnline,      setIsOnline]      = useState(true);
  const { sync } = useOfflineSales();

  // Redirect non-admins away from admin-only pages
  useEffect(() => {
    if (user?.role === "cashier" && ADMIN_PAGES.includes(page)) setPage("pos");
  }, [page, user?.role]);

  // Online/offline sync
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
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Not logged in → show login or register
  if (!token || !user) {
    if (showRegister) return <Register onBackToLogin={() => setShowRegister(false)} />;
    return <Login onShowRegister={() => setShowRegister(true)} />;
  }

  const renderPage = () => {
    // Superadmin has a special panel
    if (user.role === "superadmin") return <SuperAdminPanel />;

    switch (page) {
      case "dashboard":    return user.role === "admin" ? <Dashboard setPage={setPage} /> : <POS setPage={setPage} user={user} />;
      case "pos":          return <POS setPage={setPage} user={user} />;
      case "products":     return <Products />;
      case "categories":   return <Categories />;
      case "reports":      return <Reports />;
      case "paylater":     return <PayLater />;
      case "users":        return user.role === "admin" ? <Users /> : <POS setPage={setPage} user={user} />;
      case "adminpanel":   return user.role === "admin" ? <AdminPanel /> : <POS setPage={setPage} user={user} />;
      case "storesettings":return user.role === "admin" ? <StoreSettings /> : <POS setPage={setPage} user={user} />;
      default:             return <POS setPage={setPage} user={user} />;
    }
  };

  return (
    <RefreshProvider>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-black text-center text-sm py-1 font-semibold">
          ⚠️ Offline Mode — Sales are being saved locally
        </div>
      )}

      {/* Plan expiry warning */}
      {planExpired && (
        <div className="fixed top-0 left-0 right-0 z-[99] bg-red-500 text-white text-center text-sm py-1 font-semibold">
          🚨 Your subscription has expired. Contact support to renew.
        </div>
      )}
      {!planExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="fixed top-0 left-0 right-0 z-[99] bg-yellow-400 text-black text-center text-sm py-1 font-semibold">
          ⚠️ Your plan expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. Contact support to renew.
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