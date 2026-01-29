import React, { useState } from "react";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const token = localStorage.getItem("token");
  const [page, setPage] = useState("pos");

  if (!token) {
    return (
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="p-4 flex gap-4 border-b">
        <button
          onClick={() => setPage("pos")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          POS
        </button>
        <button
          onClick={() => setPage("reports")}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Reports
        </button>
      </div>

      {page === "pos" && <POS />}
      {page === "reports" && <Reports />}
    </AuthProvider>
  );
}
