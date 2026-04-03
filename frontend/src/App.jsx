import React, { useState } from "react";
import { AuthProvider, useAuth }  from "./context/AuthContext";
import { RefreshProvider }        from "./context/RefreshContext";
import { Toaster }                from "react-hot-toast";
import DashboardLayout            from "./layouts/DashboardLayout";
import Dashboard                  from "./pages/Dashboard";
import POS                        from "./pages/POS";
import Products                   from "./pages/Products";
import Categories                 from "./pages/Categories";
import Reports                    from "./pages/Reports";
import Users                      from "./pages/Users";
import AdminPanel                 from "./pages/AdminPanel";
import Login                      from "./pages/Login";
import Register                   from "./pages/Register";
import PayLater                   from "./pages/PayLater";
import StoreSettings              from "./pages/StoreSettings";
import SuperAdminPanel            from "./pages/SuperAdminPanel";
import Customers                  from "./pages/Customers";
import ShiftPanel                 from "./pages/ShiftPanel";
import OfflineIndicator           from "./components/OfflineIndicator";

const ADMIN_PAGES = ["dashboard", "users", "adminpanel", "storesettings"];

function AppInner() {
  const { user, store, planExpired, daysUntilExpiry } = useAuth();
  const token = localStorage.getItem("token");

  const defaultPage = user?.role === "admin" ? "dashboard" : "pos";
  const [page,         setPage]         = useState(defaultPage);
  const [showRegister, setShowRegister] = useState(false);

  React.useEffect(() => {
    if (user?.role === "cashier" && ADMIN_PAGES.includes(page)) setPage("pos");
  }, [page, user?.role]);

  if (!token || !user) {
    if (showRegister) return <Register onBackToLogin={() => setShowRegister(false)} />;
    return <Login onShowRegister={() => setShowRegister(true)} />;
  }

  const renderPage = () => {
    if (user.role === "superadmin") return <SuperAdminPanel />;
    switch (page) {
      case "dashboard":     return user.role === "admin" ? <Dashboard setPage={setPage} /> : <POS setPage={setPage} user={user} />;
      case "pos":           return <POS setPage={setPage} user={user} />;
      case "products":      return <Products />;
      case "categories":    return <Categories />;
      case "reports":       return <Reports />;
      case "paylater":      return <PayLater />;
      case "customers":     return <Customers />;
      case "shift":         return <ShiftPanel />;
      case "users":         return user.role === "admin" ? <Users />         : <POS setPage={setPage} user={user} />;
      case "adminpanel":    return user.role === "admin" ? <AdminPanel />    : <POS setPage={setPage} user={user} />;
      case "storesettings": return user.role === "admin" ? <StoreSettings /> : <POS setPage={setPage} user={user} />;
      default:              return <POS setPage={setPage} user={user} />;
    }
  };

  return (
    <RefreshProvider>
      <OfflineIndicator />

      {planExpired && (
        <div className="fixed top-8 left-0 right-0 z-[199] bg-red-500 text-white text-center text-sm py-1 font-semibold">
          🚨 Subscription expired — contact support to renew
        </div>
      )}
      {!planExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="fixed top-8 left-0 right-0 z-[199] bg-yellow-400 text-black text-center text-sm py-1 font-semibold">
          ⚠️ Plan expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""} — contact support
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