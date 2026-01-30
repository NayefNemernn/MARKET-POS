import React, { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";

export default function App() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const [page, setPage] = useState("dashboard");

  // Not logged in
  if (!token || !user) {
    return (
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
  }

  // Prevent cashier from opening admin pages
  useEffect(() => {
    if (
      user.role !== "admin" &&
      ["products", "categories", "users", "reports"].includes(page)
    ) {
      setPage("dashboard");
    }
  }, [page, user.role]);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard setPage={setPage} />; // ✅ FIX
      case "pos":
        return <POS />;
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      case "users":
        return <Users />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <AuthProvider>
      <DashboardLayout page={page} setPage={setPage} user={user}>
        {renderPage()}
      </DashboardLayout>
    </AuthProvider>
  );
}
