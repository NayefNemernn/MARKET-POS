import React, { useEffect, useState } from "react";
import { getMyStore, updateStore, addCashier, updateCashier, removeCashier } from "../api/store.api";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Store, Users, Settings, CreditCard, UserPlus, Trash2,
  LogOut, KeyRound, X, Save, CheckCircle, XCircle,
  AlertTriangle, Clock, ChevronDown, ChevronUp
} from "lucide-react";

const PLAN_COLORS = {
  trial:      "bg-yellow-100 text-yellow-700 border-yellow-200",
  basic:      "bg-blue-100 text-blue-700 border-blue-200",
  pro:        "bg-purple-100 text-purple-700 border-purple-200",
  enterprise: "bg-green-100 text-green-700 border-green-200",
};

export default function StoreSettings() {
  const { store: ctxStore, updateStore: updateCtxStore, user } = useAuth();

  const [tab,          setTab]          = useState("settings");
  const [store,        setStore]        = useState(null);
  const [cashiers,     setCashiers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [pwModal,      setPwModal]      = useState(null);
  const [newPassword,  setNewPassword]  = useState("");
  const [expanded,     setExpanded]     = useState({});

  // Store settings form
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", taxNumber: "",
    currency: "USD", currencySymbol: "$", taxRate: 0,
    language: "en", receiptFooter: "",
  });

  // New cashier form
  const [cashierForm, setCashierForm] = useState({ username: "", password: "", maxDevices: 1 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storeData, usersData] = await Promise.all([
        getMyStore(),
        api.get("/users").then(r => r.data),
      ]);
      setStore(storeData);
      setCashiers(usersData);
      setForm({
        name:           storeData.name           || "",
        address:        storeData.address        || "",
        phone:          storeData.phone          || "",
        email:          storeData.email          || "",
        taxNumber:      storeData.taxNumber      || "",
        currency:       storeData.currency       || "USD",
        currencySymbol: storeData.currencySymbol || "$",
        taxRate:        storeData.taxRate        || 0,
        language:       storeData.language       || "en",
        receiptFooter:  storeData.receiptFooter  || "",
      });
    } catch {
      toast.error("Failed to load store settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateStore(form);
      updateCtxStore(res.store);
      setStore(res.store);
      toast.success("Store settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCashier = async (e) => {
    e.preventDefault();
    try {
      await addCashier(cashierForm);
      toast.success("Cashier added");
      setCashierForm({ username: "", password: "", maxDevices: 1 });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add cashier");
    }
  };

  const handleToggleCashier = async (cashier) => {
    try {
      await updateCashier(cashier._id, { active: !cashier.active });
      toast.success(`${cashier.username} ${cashier.active ? "disabled" : "enabled"}`);
      loadData();
    } catch {
      toast.error("Failed to update cashier");
    }
  };

  const handleRemoveCashier = async (cashier) => {
    if (!confirm(`Permanently delete "${cashier.username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${cashier._id}`);
      toast.success("User deleted");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleForceLogout = async (cashier) => {
    try {
      await api.post(`/users/${cashier._id}/force-logout`);
      toast.success(`${cashier.username} logged out`);
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 4) { toast.error("Min 4 characters"); return; }
    try {
      await api.post(`/users/${pwModal._id}/change-password`, { newPassword });
      toast.success("Password changed");
      setPwModal(null); setNewPassword("");
    } catch {
      toast.error("Failed to change password");
    }
  };

  const handleUpdateDevices = async (cashier, delta) => {
    const newMax = (cashier.maxDevices || 1) + delta;
    if (newMax < 1 || newMax > 10) return;
    try {
      await api.patch(`/users/${cashier._id}`, { maxDevices: newMax });
      toast.success(`Max devices set to ${newMax}`);
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  // Plan info
  const expiry    = store?.planExpiresAt ? new Date(store.planExpiresAt) : null;
  const expired   = expiry && expiry < new Date();
  const daysLeft  = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950">
      <div className="p-5 space-y-5 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold dark:text-white">Store Settings</h1>
            <p className="text-xs text-gray-500">{store?.name} · {store?.slug}</p>
          </div>
        </div>

        {/* Plan Banner */}
        {store && (
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${expired ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30" : daysLeft <= 7 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-500/30" : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}>
            <CreditCard size={18} className={expired ? "text-red-500" : daysLeft <= 7 ? "text-yellow-500" : "text-indigo-500"} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${PLAN_COLORS[store.plan] || "bg-gray-100 text-gray-600"}`}>
                  {(store.plan || "trial").toUpperCase()} PLAN
                </span>
                {expired
                  ? <span className="text-sm text-red-600 font-medium flex items-center gap-1"><AlertTriangle size={13}/> Subscription expired — contact support to renew</span>
                  : daysLeft <= 7
                  ? <span className="text-sm text-yellow-600 font-medium flex items-center gap-1"><Clock size={13}/> {daysLeft} days remaining</span>
                  : <span className="text-sm text-gray-500">{daysLeft} days remaining · expires {expiry?.toLocaleDateString()}</span>
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {store.maxUsers} users · {store.maxProducts} products · {cashiers.length} users active
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/10 w-fit">
          {[
            { id: "settings", label: "Store Info",  icon: Settings },
            { id: "cashiers", label: "Team",        icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                ${tab === id ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── STORE SETTINGS TAB ── */}
        {tab === "settings" && (
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-6">

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Business Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Store Name",   key: "name",      placeholder: "My Store" },
                  { label: "Phone",        key: "phone",     placeholder: "+1 555 0000" },
                  { label: "Email",        key: "email",     placeholder: "store@example.com", type: "email" },
                  { label: "Address",      key: "address",   placeholder: "123 Main St" },
                  { label: "Tax Number",   key: "taxNumber", placeholder: "VAT/EIN" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input
                      type={type || "text"}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Currency & Tax</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Currency Code</label>
                  <input
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                    maxLength={3}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Currency Symbol</label>
                  <input
                    value={form.currencySymbol}
                    onChange={e => setForm(f => ({ ...f, currencySymbol: e.target.value }))}
                    placeholder="$"
                    maxLength={3}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tax Rate (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={form.taxRate}
                    onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Receipt Footer</h2>
              <textarea
                value={form.receiptFooter}
                onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))}
                placeholder="Thank you for shopping with us!"
                rows={3}
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {tab === "cashiers" && (
          <div className="space-y-4">

            {/* Add cashier button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cashiers.length} / {store?.maxUsers} users used
              </p>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"
              >
                <UserPlus size={14} /> Add Cashier
              </button>
            </div>

            {/* Add cashier form */}
            {showAddForm && (
              <form onSubmit={handleAddCashier}
                className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 grid sm:grid-cols-4 gap-3">
                <input
                  required placeholder="Username"
                  value={cashierForm.username}
                  onChange={e => setCashierForm(f => ({ ...f, username: e.target.value }))}
                  className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <input
                  required type="password" placeholder="Password"
                  value={cashierForm.password}
                  onChange={e => setCashierForm(f => ({ ...f, password: e.target.value }))}
                  className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <select
                  value={cashierForm.maxDevices}
                  onChange={e => setCashierForm(f => ({ ...f, maxDevices: +e.target.value }))}
                  className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#141414] dark:text-white text-sm outline-none"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} device{n > 1 ? "s" : ""}</option>)}
                </select>
                <button className="bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold py-2">
                  Create
                </button>
              </form>
            )}

            {/* Users list — shows ALL users including yourself */}
            <div className="space-y-3">
              {cashiers.map(cashier => {
                const isSelf = cashier._id === user?._id;
                return (
                <div key={cashier._id} className={`bg-white dark:bg-[#141414] rounded-2xl border overflow-hidden
                  ${isSelf ? "border-indigo-200 dark:border-indigo-500/30" : "border-gray-100 dark:border-white/5"}`}>
                  <div className="flex items-center gap-4 px-5 py-4 flex-wrap">

                    {/* Avatar */}
                    <div className="flex items-center gap-3 flex-1 min-w-40">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${cashier.role === "admin" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                          {cashier.username.charAt(0).toUpperCase()}
                        </div>
                        {cashier.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#141414]"/>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm dark:text-white">{cashier.username}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{cashier.role}</span>
                          {isSelf && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 font-medium">You</span>}
                          {!cashier.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Disabled</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cashier.activeDevices || 0}/{cashier.maxDevices || 1} devices active
                        </p>
                      </div>
                    </div>

                    {/* Device controls */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdateDevices(cashier, -1)} disabled={(cashier.maxDevices || 1) <= 1}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-sm transition">−</button>
                      <span className="text-sm font-semibold w-4 text-center dark:text-white">{cashier.maxDevices || 1}</span>
                      <button onClick={() => handleUpdateDevices(cashier, +1)} disabled={(cashier.maxDevices || 1) >= 10}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-sm transition">+</button>
                      <span className="text-xs text-gray-400">devices</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={() => { setPwModal(cashier); setNewPassword(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition">
                        <KeyRound size={11} /> Password
                      </button>
                      {cashier.isOnline && !isSelf && (
                        <button onClick={() => handleForceLogout(cashier)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition">
                          <LogOut size={11} /> Kick
                        </button>
                      )}
                      <button onClick={() => handleToggleCashier(cashier)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                          ${cashier.active ? "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100" : "bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100"}`}>
                        {cashier.active ? <><XCircle size={11}/> Disable</> : <><CheckCircle size={11}/> Enable</>}
                      </button>
                      {!isSelf && (
                        <button onClick={() => handleRemoveCashier(cashier)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}

              {cashiers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No users found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setPwModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold dark:text-white">Change Password — <span className="text-indigo-500">{pwModal.username}</span></h2>
              <button onClick={() => setPwModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <input
              type="password" placeholder="New password (min 4 chars)" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-4"
            />
            <button onClick={handleChangePassword} disabled={newPassword.length < 4}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition">
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}