import React, { useEffect, useState } from "react";
import { getAllStores, getPlatformStats, updateStorePlan, toggleStoreActive } from "../api/superadmin.api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const PLAN_COLORS = {
  trial:      "bg-yellow-100 text-yellow-700",
  basic:      "bg-blue-100 text-blue-700",
  pro:        "bg-purple-100 text-purple-700",
  enterprise: "bg-green-100 text-green-700",
};

const PLAN_LIMITS = {
  trial:      { maxUsers: 2,   maxProducts: 100,  days: 14 },
  basic:      { maxUsers: 5,   maxProducts: 500,  days: 30 },
  pro:        { maxUsers: 20,  maxProducts: 2000, days: 365 },
  enterprise: { maxUsers: 100, maxProducts: 99999, days: 365 },
};

export default function SuperAdminPanel() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [editingPlan, setEditingPlan] = useState(null); // store being edited
  const [planForm, setPlanForm] = useState({ plan: "", maxUsers: "", maxProducts: "", expiresAt: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, st] = await Promise.all([getPlatformStats(), getAllStores()]);
      setStats(s);
      setStores(st);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleStoreActive(id);
      toast.success(`Store ${res.active ? "activated" : "deactivated"}`);
      setStores(prev => prev.map(s => s._id === id ? { ...s, active: res.active } : s));
    } catch {
      toast.error("Failed to toggle store");
    }
  };

  const openPlanEditor = (store) => {
    setEditingPlan(store);
    const defaults = PLAN_LIMITS[store.plan] || PLAN_LIMITS.basic;
    const expiry = store.planExpiresAt
      ? new Date(store.planExpiresAt).toISOString().split("T")[0]
      : "";
    setPlanForm({
      plan:        store.plan,
      maxUsers:    store.maxUsers    || defaults.maxUsers,
      maxProducts: store.maxProducts || defaults.maxProducts,
      expiresAt:   expiry,
    });
  };

  const handlePlanChange = (e) => {
    const newPlan = e.target.value;
    const defaults = PLAN_LIMITS[newPlan];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + defaults.days);
    setPlanForm({
      plan:        newPlan,
      maxUsers:    defaults.maxUsers,
      maxProducts: defaults.maxProducts,
      expiresAt:   expiryDate.toISOString().split("T")[0],
    });
  };

  const savePlan = async () => {
    try {
      await updateStorePlan(editingPlan._id, planForm);
      toast.success("Plan updated");
      setEditingPlan(null);
      loadData();
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🌐 Super Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all stores on the platform</p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Stores",   value: stats.totalStores,   icon: "🏪" },
            { label: "Active Stores",  value: stats.activeStores,  icon: "✅" },
            { label: "Total Users",    value: stats.totalUsers,    icon: "👤" },
            { label: "Total Products", value: stats.totalProducts, icon: "📦" },
            { label: "Total Revenue",  value: `$${(stats.totalRevenue || 0).toFixed(2)}`, icon: "💰" },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Distribution */}
      {stats?.planDistribution?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Plan Distribution</h2>
          <div className="flex gap-4 flex-wrap">
            {stats.planDistribution.map(p => (
              <div key={p._id} className={`px-3 py-1.5 rounded-full text-sm font-medium ${PLAN_COLORS[p._id] || "bg-gray-100 text-gray-600"}`}>
                {p._id}: {p.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stores Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">All Stores ({stores.length})</h2>
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-56"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
              <tr>
                {["Store", "Owner", "Plan", "Expires", "Users", "Products", "Revenue", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(store => {
                const expiry    = store.planExpiresAt ? new Date(store.planExpiresAt) : null;
                const expired   = expiry && expiry < new Date();
                const daysLeft  = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <tr key={store._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {store.name}
                      <div className="text-xs text-gray-400">{store.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{store.owner?.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[store.plan] || "bg-gray-100 text-gray-600"}`}>
                        {store.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expiry ? (
                        <span className={expired ? "text-red-500 font-medium" : daysLeft <= 7 ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"}>
                          {expired ? "Expired" : `${daysLeft}d left`}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{store.userCount ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{store.productCount ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      ${(store.totalRevenue || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {store.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPlanEditor(store)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          Plan
                        </button>
                        <button
                          onClick={() => handleToggle(store._id)}
                          className={`px-2 py-1 text-xs rounded ${store.active ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"}`}
                        >
                          {store.active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Editor Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Edit Plan — {editingPlan.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Plan</label>
                <select
                  value={planForm.plan}
                  onChange={handlePlanChange}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {["trial", "basic", "pro", "enterprise"].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Max Users</label>
                  <input
                    type="number" min="1"
                    value={planForm.maxUsers}
                    onChange={e => setPlanForm(f => ({ ...f, maxUsers: +e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Max Products</label>
                  <input
                    type="number" min="1"
                    value={planForm.maxProducts}
                    onChange={e => setPlanForm(f => ({ ...f, maxProducts: +e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Expires At</label>
                <input
                  type="date"
                  value={planForm.expiresAt}
                  onChange={e => setPlanForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={savePlan} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700">
                Save Plan
              </button>
              <button onClick={() => setEditingPlan(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}