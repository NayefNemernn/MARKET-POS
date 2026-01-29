import React, { useState, useEffect } from "react";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const [page, setPage] = useState("pos");

  // If not logged in → Login
  if (!token || !user) {
    return (
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
  }

  // cashier can NEVER access admin pages
  useEffect(() => {
    if (user.role !== "admin" && (page === "reports" || page === "products")) {
      setPage("pos");
    }
  }, [page, user.role]);

  return (
    <AuthProvider>
      {/* NAV BAR */}
      <div className="p-4 flex gap-4 border-b">
        <button
          onClick={() => setPage("pos")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          POS
        </button>

        {user.role === "admin" && (
          <>
            <button
              onClick={() => setPage("reports")}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Reports
            </button>

            <button
              onClick={() => setPage("products")}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Products
            </button>
          </>
        )}
      </div>

      {/* PAGES */}
      {page === "pos" && <POS />}
      {page === "reports" && <Reports />}
      {page === "products" && <Products />}
    </AuthProvider>
  );
}
