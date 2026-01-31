import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard.api";

/**
 * Props expected:
 * - setPage (function)
 */
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
        // 403 / not admin / token expired
        setError("You are not allowed to view the dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
          value={navigator.onLine ? "Online" : "Offline"}
          status
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-xl shadow p-6">
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
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl shadow bg-white cursor-pointer
        hover:shadow-lg transition
        ${danger ? "border-l-4 border-red-500" : ""}
        ${status ? "border-l-4 border-green-500" : ""}
      `}
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3 rounded-lg bg-blue-600 text-white
        hover:bg-blue-700 transition font-medium"
    >
      {label}
    </button>
  );
}
