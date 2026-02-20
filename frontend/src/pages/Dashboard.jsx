import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard.api";

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError("You are not allowed to view the dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 animate-pulse">
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium">
        {error}
      </div>
    );
  }

  const isOnline =
    typeof navigator !== "undefined" && navigator.onLine;

  return (
    <div className="space-y-10 p-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back 👋 Here’s what’s happening today.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard
          title="Today Sales"
          value={`$${stats?.todaySales?.toFixed(2) ?? "0.00"}`}
          onClick={() => setPage("reports")}
        />

        <KpiCard
          title="Products"
          value={stats?.totalProducts ?? 0}
          onClick={() => setPage("products")}
        />

        <KpiCard
          title="Low Stock"
          value={stats?.lowStock ?? 0}
          danger
          onClick={() => setPage("products")}
        />

        <KpiCard
          title="System Status"
          value={isOnline ? "Online" : "Offline"}
          status
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <ActionButton
            label="Open POS"
            onClick={() => setPage("pos")}
          />
          <ActionButton
            label="Add Product"
            onClick={() => setPage("products")}
          />
          <ActionButton
            label="View Reports"
            onClick={() => setPage("reports")}
          />
        </div>
      </div>
    </div>
  );
}

/* =======================
   COMPONENTS
======================= */

function KpiCard({ title, value, danger, status, onClick }) {
  const clickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        p-6 rounded-2xl bg-white border shadow-sm
        transition-all duration-200
        ${clickable ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""}
        ${danger ? "border-l-4 border-red-500" : ""}
        ${status ? "border-l-4 border-green-500" : ""}
      `}
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        px-5 py-3 rounded-xl
        bg-blue-600 text-white font-medium
        hover:bg-blue-700
        active:scale-95
        transition-all duration-150
      "
    >
      {label}
    </button>
  );
}