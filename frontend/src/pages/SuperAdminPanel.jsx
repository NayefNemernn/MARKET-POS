import React, { useEffect, useState } from "react";
import {
  getAllStores, getPlatformStats, updateStorePlan, toggleStoreActive,
  createStore, deleteStore, resetAdminPassword, impersonateStore,
  sendNotification, getStoreDetails, bulkAction, bulkNotify,
  transferOwner, cloneStore, exportStores, getPlatformAuditLog,
  updateStoreNotes, setWelcomeMessage, getActivityFeed,
  updateSuperAdminProfile, createCashier,
  getStoreUsers, getStoreGlobalStats, createStoreUser, updateStoreUser,
  deleteStoreUser, forceLogoutStoreUser, forceLogoutStoreDevice,
  changeStoreUserPW, getStoreUserSales, clearStoreUserSales, clearStoreUserProducts,
  getSuperAdminProfile,
} from "../api/superadmin.api";
import { useAuth } from "../context/AuthContext";
import { useSuperAdminTranslation } from "../hooks/useSuperAdminTranslation";
import { useLang } from "../context/LanguageContext";
import toast from "react-hot-toast";
import {
  Users, Wifi, WifiOff, Monitor, Smartphone, LogOut, KeyRound,
  CheckCircle, XCircle, Trash2, Plus, Minus, Eye, TrendingUp,
  DollarSign, ShoppingCart, Activity, Package, ChevronDown, ChevronUp,
  Search, UserPlus, X, RefreshCw,
} from "lucide-react";

/* ── helpers ── */
const PLAN_COLORS = { trial: "bg-yellow-100 text-yellow-700", basic: "bg-blue-100 text-blue-700", pro: "bg-purple-100 text-purple-700", enterprise: "bg-green-100 text-green-700" };
const PLAN_LIMITS = { trial: { maxUsers: 2, maxProducts: 100, days: 14 }, basic: { maxUsers: 5, maxProducts: 500, days: 30 }, pro: { maxUsers: 20, maxProducts: 2000, days: 365 }, enterprise: { maxUsers: 100, maxProducts: 99999, days: 365 } };
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 w-full ${wide ? "max-w-3xl" : "max-w-lg"} shadow-2xl max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      {children}
    </div>
  </div>
);

export default function SuperAdminPanel() {
  const { user, login } = useAuth();
  const t = useSuperAdminTranslation();
  const { lang } = useLang();
  const TABS = [t.tabStores, t.tabActivity, t.tabAuditLog, t.tabProfile];
  const timeAgo = (date) => { if (!date) return t.never; const s = Math.floor((Date.now() - new Date(date)) / 1000); if (s < 60) return t.justNow; if (s < 3600) return `${Math.floor(s/60)} ${t.mAgo}`; if (s < 86400) return `${Math.floor(s/3600)} ${t.hAgo}`; return new Date(date).toLocaleDateString(); };
  const [tab,      setTab]      = useState("Stores");
  const [stats,    setStats]    = useState(null);
  const [stores,   setStores]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState([]);

  // Store modals
  const [editingPlan,    setEditingPlan]    = useState(null);
  const [planForm,       setPlanForm]       = useState({ plan: "", maxUsers: "", maxProducts: "", expiresAt: "", monthlyPrice: "" });
  const [createModal,    setCreateModal]    = useState(false);
  const [createForm,     setCreateForm]     = useState({ storeName: "", username: "", password: "", currency: "USD", language: "en", plan: "trial" });
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [resetTarget,    setResetTarget]    = useState(null);
  const [resetPassword,  setResetPassword]  = useState("");
  const [notifyTarget,   setNotifyTarget]   = useState(null);
  const [notifyForm,     setNotifyForm]     = useState({ message: "", type: "info" });
  const [detailStore,    setDetailStore]    = useState(null);
  const [detailData,     setDetailData]     = useState(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [cloneTarget,    setCloneTarget]    = useState(null);
  const [cloneForm,      setCloneForm]      = useState({ newStoreName: "", newUsername: "", newPassword: "" });
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferForm,   setTransferForm]   = useState({ newUsername: "", newPassword: "" });
  const [welcomeTarget,  setWelcomeTarget]  = useState(null);
  const [welcomeMsg,     setWelcomeMsg]     = useState("");
  const [notesTarget,    setNotesTarget]    = useState(null);
  const [notesText,      setNotesText]      = useState("");
  const [bulkNotifyModal,  setBulkNotifyModal]  = useState(false);
  const [bulkNotifyForm,   setBulkNotifyForm]   = useState({ message: "", type: "info" });
  const [bulkExtendDays,   setBulkExtendDays]   = useState(30);
  const [profileForm,      setProfileForm]      = useState({ username: user?.username || "", newPassword: "", maxDevices: 1 });
  const [profileInfo,      setProfileInfo]      = useState(null);
  const [activity,         setActivity]         = useState([]);
  const [auditLogs,        setAuditLogs]        = useState([]);

  // Store users panel
  const [usersStoreTarget, setUsersStoreTarget] = useState(null);
  const [storeUsers,       setStoreUsers]       = useState([]);
  const [storeStats,       setStoreStats]       = useState(null);
  const [usersLoading,     setUsersLoading]     = useState(false);
  const [usersSearch,      setUsersSearch]      = useState("");
  const [usersTab,         setUsersTab]         = useState("overview");
  const [showUserForm,     setShowUserForm]      = useState(false);
  const [userForm,         setUserForm]          = useState({ username: "", password: "", role: "cashier" });
  const [userPwModal,      setUserPwModal]       = useState(null);
  const [userNewPin,       setUserNewPin]        = useState("");
  const [userSalesModal,   setUserSalesModal]    = useState(null);
  const [userSales,        setUserSales]         = useState([]);
  const [expandedUser,     setExpandedUser]      = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const [s, st] = await Promise.all([getPlatformStats(), getAllStores()]); setStats(s); setStores(st); }
    catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === t.tabActivity)  getActivityFeed().then(setActivity).catch(() => toast.error("Failed"));
    if (tab === t.tabAuditLog)  getPlatformAuditLog({ limit: 100 }).then(setAuditLogs).catch(() => toast.error("Failed"));
    if (tab === t.tabProfile)   getSuperAdminProfile().then(info => { setProfileInfo(info); setProfileForm(f => ({ ...f, username: info.username, maxDevices: info.maxDevices || 1 })); }).catch(() => {});
  }, [tab]);

  /* ── Store handlers ── */
  const handleToggle      = async (id) => { try { const r = await toggleStoreActive(id); toast.success(`Store ${r.active ? "activated" : "deactivated"}`); setStores(p => p.map(s => s._id === id ? { ...s, active: r.active } : s)); } catch { toast.error("Failed"); } };
  const openPlanEditor    = (store) => { setEditingPlan(store); const d = PLAN_LIMITS[store.plan] || PLAN_LIMITS.basic; const exp = store.planExpiresAt ? new Date(store.planExpiresAt).toISOString().split("T")[0] : ""; setPlanForm({ plan: store.plan, maxUsers: store.maxUsers || d.maxUsers, maxProducts: store.maxProducts || d.maxProducts, expiresAt: exp, monthlyPrice: store.monthlyPrice || "" }); };
  const handlePlanChange  = (e) => { const d = PLAN_LIMITS[e.target.value]; const exp = new Date(); exp.setDate(exp.getDate() + d.days); setPlanForm(f => ({ ...f, plan: e.target.value, maxUsers: d.maxUsers, maxProducts: d.maxProducts, expiresAt: exp.toISOString().split("T")[0] })); };
  const savePlan          = async () => { try { await updateStorePlan(editingPlan._id, planForm); toast.success("Plan updated"); setEditingPlan(null); loadData(); } catch { toast.error("Failed"); } };
  const handleCreateStore = async () => { try { await createStore(createForm); toast.success("Store created"); setCreateModal(false); setCreateForm({ storeName: "", username: "", password: "", currency: "USD", language: "en", plan: "trial" }); loadData(); } catch (e) { toast.error(e.response?.data?.message || "Failed"); } };
  const handleDeleteStore = async () => { try { await deleteStore(deleteTarget._id); toast.success("Store deleted"); setDeleteTarget(null); loadData(); } catch { toast.error("Failed"); } };
  const handleResetPW     = async () => { if (!resetPassword.trim()) return toast.error("Enter password"); try { await resetAdminPassword(resetTarget._id, { newPassword: resetPassword }); toast.success("Password reset"); setResetTarget(null); setResetPassword(""); } catch { toast.error("Failed"); } };
  const handleImpersonate = async (store) => { try { const d = await impersonateStore(store._id); toast.success(`Logged in as ${d.user.username}`); login(d); } catch { toast.error("Failed"); } };
  const handleNotify      = async () => { if (!notifyForm.message.trim()) return toast.error("Enter message"); try { await sendNotification(notifyTarget._id, notifyForm); toast.success("Sent"); setNotifyTarget(null); setNotifyForm({ message: "", type: "info" }); } catch { toast.error("Failed"); } };
  const handleClone       = async () => { try { await cloneStore(cloneTarget._id, cloneForm); toast.success("Cloned"); setCloneTarget(null); setCloneForm({ newStoreName: "", newUsername: "", newPassword: "" }); loadData(); } catch (e) { toast.error(e.response?.data?.message || "Failed"); } };
  const handleTransfer    = async () => { try { await transferOwner(transferTarget._id, transferForm); toast.success("Transferred"); setTransferTarget(null); setTransferForm({ newUsername: "", newPassword: "" }); loadData(); } catch (e) { toast.error(e.response?.data?.message || "Failed"); } };
  const handleWelcome     = async () => { try { await setWelcomeMessage(welcomeTarget._id, { welcomeMessage: welcomeMsg }); toast.success("Saved"); setWelcomeTarget(null); } catch { toast.error("Failed"); } };
  const handleNotes       = async () => { try { await updateStoreNotes(notesTarget._id, { notes: notesText }); toast.success("Saved"); setNotesTarget(null); } catch { toast.error("Failed"); } };
  const handleBulkNotify  = async () => { if (!bulkNotifyForm.message.trim()) return toast.error("Enter message"); try { const r = await bulkNotify({ ...bulkNotifyForm, storeIds: selected.length ? selected : undefined }); toast.success(r.message); setBulkNotifyModal(false); } catch { toast.error("Failed"); } };
  const handleBulkAction  = async (action) => { if (!selected.length) return toast.error("Select stores first"); try { const r = await bulkAction({ storeIds: selected, action, days: bulkExtendDays }); toast.success(r.message); setSelected([]); loadData(); } catch { toast.error("Failed"); } };
  const handleExport      = async () => { try { const data = await exportStores(); const csv = [Object.keys(data[0]).join(","), ...data.map(r => Object.values(r).join(","))].join("\n"); const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "stores.csv"; a.click(); toast.success("Exported"); } catch { toast.error("Failed"); } };
  const handleProfile     = async () => { try { const r = await updateSuperAdminProfile(profileForm); toast.success(r.message); setProfileInfo(p => p ? { ...p, maxDevices: r.maxDevices || profileForm.maxDevices } : p); } catch (e) { toast.error(e.response?.data?.message || "Failed"); } };

  const openDetails = async (store) => {
    setDetailStore(store); setDetailLoading(true);
    try { setDetailData(await getStoreDetails(store._id)); } catch { toast.error("Failed"); } finally { setDetailLoading(false); }
  };

  /* ── Store Users handlers ── */
  const openStoreUsers = async (store) => {
    setUsersStoreTarget(store); setUsersLoading(true); setStoreUsers([]); setStoreStats(null); setUsersTab("overview");
    try {
      const [users, stats] = await Promise.all([getStoreUsers(store._id), getStoreGlobalStats(store._id)]);
      setStoreUsers(users); setStoreStats(stats);
    } catch { toast.error("Failed to load users"); }
    finally { setUsersLoading(false); }
  };

  const reloadStoreUsers = async () => {
    if (!usersStoreTarget) return;
    try {
      const [users, stats] = await Promise.all([getStoreUsers(usersStoreTarget._id), getStoreGlobalStats(usersStoreTarget._id)]);
      setStoreUsers(users); setStoreStats(stats);
    } catch { toast.error("Failed"); }
  };

  const handleCreateStoreUser  = async (e) => { e.preventDefault(); try { await createStoreUser(usersStoreTarget._id, userForm); toast.success("User created"); setShowUserForm(false); setUserForm({ username: "", password: "", role: "cashier" }); reloadStoreUsers(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } };
  const handleToggleStoreUser  = async (u) => { try { await updateStoreUser(usersStoreTarget._id, u._id, { active: !u.active }); toast.success(`${u.username} ${u.active ? "disabled" : "enabled"}`); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleDeleteStoreUser  = async (u) => { if (!confirm(`Delete "${u.username}"?`)) return; try { await deleteStoreUser(usersStoreTarget._id, u._id); toast.success("Deleted"); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleForceLogout      = async (u) => { try { await forceLogoutStoreUser(usersStoreTarget._id, u._id); toast.success(`${u.username} logged out`); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleKickDevice       = async (u, deviceId, name) => { try { await forceLogoutStoreDevice(usersStoreTarget._id, u._id, { deviceId }); toast.success(`Device "${name}" kicked`); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleChangeUserPW     = async () => { if (userNewPin.length < 4) return toast.error("Min 4 chars"); try { await changeStoreUserPW(usersStoreTarget._id, userPwModal._id, { newPassword: userNewPin }); toast.success("Password changed"); setUserPwModal(null); setUserNewPin(""); } catch { toast.error("Failed"); } };
  const handleViewSales        = async (u) => { setUserSalesModal(u); try { setUserSales(await getStoreUserSales(usersStoreTarget._id, u._id)); } catch { toast.error("Failed"); } };
  const handleClearUserSales   = async (u) => { if (!confirm(`Delete ALL sales for "${u.username}"?`)) return; try { const r = await clearStoreUserSales(usersStoreTarget._id, u._id); toast.success(r.message); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleClearUserProducts = async (u) => { if (!confirm(`Delete ALL products for this store?`)) return; try { const r = await clearStoreUserProducts(usersStoreTarget._id, u._id); toast.success(r.message); reloadStoreUsers(); } catch { toast.error("Failed"); } };
  const handleUpdateMaxDevices  = async (u, newMax) => { if (newMax < 1 || newMax > 10) return; try { await updateStoreUser(usersStoreTarget._id, u._id, { maxDevices: newMax }); reloadStoreUsers(); } catch { toast.error("Failed"); } };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAll    = () => setSelected(filtered.map(s => s._id));
  const clearSelect  = () => setSelected([]);

  const filtered      = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.owner?.username?.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = storeUsers.filter(u => u.username.toLowerCase().includes(usersSearch.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">{t.detailLoading}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🌐 {t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow">{t.createStore}</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { icon: "🏪", label: t.totalStores,   value: stats.totalStores },
            { icon: "✅", label: t.activeStores,  value: stats.activeStores },
            { icon: "👤", label: t.totalUsers,    value: stats.totalUsers },
            { icon: "📦", label: t.totalProducts, value: stats.totalProducts },
            { icon: "💰", label: t.totalRevenue,  value: fmt(stats.totalRevenue) },
            { icon: "⚠️", label: t.expiringSoon,  value: stats.expiringSoon, warn: stats.expiringSoon > 0 },
            { icon: "🚨", label: t.expired,       value: stats.expired, danger: stats.expired > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border ${s.danger ? "border-red-300" : s.warn ? "border-yellow-300" : "border-gray-100 dark:border-gray-700"}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Plan dist */}
      {stats?.planDistribution?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap items-center">
          <span className="text-sm font-semibold text-gray-500">{t.plans}</span>
          {stats.planDistribution.map(p => <span key={p._id} className={`px-3 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[p._id] || "bg-gray-100 text-gray-600"}`}>{p._id}: {p.count}</span>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-gray-700">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? "bg-white dark:bg-gray-800 text-blue-600 border border-b-white dark:border-gray-700 dark:border-b-gray-800 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── STORES TAB ── */}
      {tab === t.tabStores && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white flex-1">{t.allStores} ({stores.length})</h2>
            <input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-44" />
            <button onClick={handleExport} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200">{t.exportCsv}</button>
            {selected.length > 0 && (
              <div className="flex gap-1 items-center flex-wrap">
                <span className="text-xs text-gray-500">{selected.length} {t.selected}</span>
                <button onClick={() => handleBulkAction("enable")}  className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100">{t.btnEnable}</button>
                <button onClick={() => handleBulkAction("disable")} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">{t.btnDisable}</button>
                <button onClick={() => handleBulkAction("extend")}  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+{bulkExtendDays}d</button>
                <input type="number" value={bulkExtendDays} onChange={e => setBulkExtendDays(+e.target.value)} className="w-14 text-xs border rounded px-1 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <button onClick={() => setBulkNotifyModal(true)} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">{t.notify}</button>
                <button onClick={clearSelect} className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">{t.clear}</button>
              </div>
            )}
            {!selected.length && <button onClick={selectAll} className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200">{t.selectAll}</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-3 w-8"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={e => e.target.checked ? selectAll() : clearSelect()} /></th>
                  {[t.colStore, t.colOwner, t.colPlan, t.colExpires, t.colUsers, t.colProducts, t.colRevenue, t.colPrice, t.colStatus, t.colActions].map(h => <th key={h} className="px-3 py-3 text-left font-medium text-xs">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(store => {
                  const expiry = store.planExpiresAt ? new Date(store.planExpiresAt) : null;
                  const expired = expiry && expiry < new Date();
                  const daysLeft = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
                  return (
                    <tr key={store._id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${selected.includes(store._id) ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}>
                      <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(store._id)} onChange={() => toggleSelect(store._id)} /></td>
                      <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">
                        {store.name}
                        <div className="text-xs text-gray-400">{store.slug}</div>
                        {store.internalNotes && <div className="text-xs text-yellow-600 truncate max-w-[100px]">📝 {store.internalNotes}</div>}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{store.owner?.username}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[store.plan] || "bg-gray-100 text-gray-600"}`}>{store.plan}</span></td>
                      <td className="px-3 py-2 text-xs">{expiry ? <span className={expired ? "text-red-500 font-medium" : daysLeft <= 7 ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"}>{expired ? t.expired : `${daysLeft}d`}</span> : "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{store.userCount ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{store.productCount ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">${(store.totalRevenue || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{store.monthlyPrice ? `$${store.monthlyPrice}` : "—"}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{store.active ? t.statusActive : t.statusOff}</span></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {[
                            { l: t.btnView,                                    c: "gray",   f: () => openDetails(store) },
                            { l: t.btnUsers,                                   c: "blue",   f: () => openStoreUsers(store) },
                            { l: t.btnPlan,                                    c: "indigo", f: () => openPlanEditor(store) },
                            { l: store.active ? t.btnDisable : t.btnEnable,   c: store.active ? "red" : "green", f: () => handleToggle(store._id) },
                            { l: t.btnResetPw,                                 c: "yellow", f: () => { setResetTarget(store); setResetPassword(""); } },
                            { l: t.btnLoginAs,                                 c: "purple", f: () => handleImpersonate(store) },
                            { l: t.btnCashier,                                 c: "teal",   f: () => { openStoreUsers(store); } },
                            { l: t.btnNotify,                                  c: "orange", f: () => setNotifyTarget(store) },
                            { l: t.btnWelcome,                                 c: "pink",   f: () => { setWelcomeTarget(store); setWelcomeMsg(store.welcomeMessage || ""); } },
                            { l: t.btnNotes,                                   c: "amber",  f: () => { setNotesTarget(store); setNotesText(store.internalNotes || ""); } },
                            { l: t.btnTransfer,                                c: "orange", f: () => setTransferTarget(store) },
                            { l: t.btnClone,                                   c: "cyan",   f: () => setCloneTarget(store) },
                            { l: t.btnDelete,                                  c: "red",    f: () => setDeleteTarget(store) },
                          ].map(btn => (
                            <button key={btn.l} onClick={btn.f}
                              className={`px-1.5 py-0.5 text-xs rounded bg-${btn.c}-50 text-${btn.c}-600 hover:bg-${btn.c}-100 dark:bg-${btn.c}-900/30 dark:text-${btn.c}-400 whitespace-nowrap`}>
                              {btn.l}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">{t.noStoresFound}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === t.tabActivity && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">{t.recentActivity}</h2>
            <button onClick={() => getActivityFeed().then(setActivity)} className="text-xs text-blue-500 hover:underline">{t.refresh}</button>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                <span className="text-lg">{item.type === "sale" ? "💳" : item.type === "user" ? "👤" : "🏪"}</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-800 dark:text-white">
                    {item.type === "sale"  && <><span className="font-medium">${item.amount?.toFixed(2)}</span> {t.saleAt} <span className="text-blue-500">{item.store}</span></>}
                    {item.type === "user"  && <>{t.newUser} <span className="font-medium">{item.role}</span> <span className="text-blue-500">{item.username}</span> {t.at} {item.store}</>}
                    {item.type === "store" && <>{t.newStore} <span className="font-medium">{item.name}</span> — {item.plan} plan</>}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(item.time).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div className="text-center text-gray-400 py-8">{t.noRecentActivity}</div>}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {tab === t.tabAuditLog && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">{t.platformAuditLog}</h2>
            <button onClick={() => getPlatformAuditLog({ limit: 100 }).then(setAuditLogs)} className="text-xs text-blue-500 hover:underline">{t.refresh}</button>
          </div>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-xs sticky top-0">
                <tr>{[t.auditColStore, t.auditColUser, t.auditColAction, t.auditColDesc, t.auditColTime].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {auditLogs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-3 py-2 text-xs text-blue-500">{log.storeId?.name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{log.username}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">{log.action}</span></td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">{log.description}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.noAuditLogs}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {tab === t.tabProfile && (
        <div className="space-y-4 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">{t.superAdminProfile}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.usernameLabel}</label>
                <input type="text" value={profileForm.username} onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.newPasswordLabel}</label>
                <input type="text" placeholder={t.newPasswordPh} value={profileForm.newPassword} onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>

              {/* Max Devices */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Max Devices
                  {profileInfo && <span className="ml-2 text-xs text-gray-400">({profileInfo.activeDevices} active)</span>}
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <Smartphone size={15} className="text-blue-500 shrink-0"/>
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">Simultaneous logins</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileForm(f => ({ ...f, maxDevices: Math.max(1, (f.maxDevices || 1) - 1) }))}
                      disabled={(profileForm.maxDevices || 1) <= 1}
                      className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 disabled:opacity-30 transition">
                      <Minus size={12}/>
                    </button>
                    <span className="text-base font-bold w-6 text-center">{profileForm.maxDevices || 1}</span>
                    <button
                      type="button"
                      onClick={() => setProfileForm(f => ({ ...f, maxDevices: Math.min(10, (f.maxDevices || 1) + 1) }))}
                      disabled={(profileForm.maxDevices || 1) >= 10}
                      className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 disabled:opacity-30 transition">
                      <Plus size={12}/>
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleProfile} className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700">{t.saveProfile}</button>
            </div>
          </div>

          {/* Active devices list */}
          {profileInfo?.devices?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Monitor size={14} className="text-blue-500"/> Active Sessions ({profileInfo.devices.length}/{profileInfo.maxDevices})
              </h3>
              <div className="space-y-2">
                {profileInfo.devices.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                    <Monitor size={13} className="text-blue-500 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.deviceName || "Unknown device"}</p>
                      <p className="text-xs text-gray-400">{d.deviceOS} · {d.deviceBrowser} · {timeAgo(d.lastLoginAt)}</p>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ STORE USERS MODAL (full AdminPanel feature set) ════ */}
      {usersStoreTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">👥 {usersStoreTarget.name} — {t.storeUsersTitle}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t.fullUserMgmt}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={reloadStoreUsers} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><RefreshCw size={12}/> {t.refresh}</button>
                <button onClick={() => setShowUserForm(!showUserForm)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"><UserPlus size={12}/> {t.addUser}</button>
                <button onClick={() => { setUsersStoreTarget(null); setStoreUsers([]); setStoreStats(null); }} className="text-gray-400 hover:text-gray-600 text-xl px-2">✕</button>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div className="p-5 space-y-5">

                {/* Sub-tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                  {[{ id: "overview", label: t.tabOverview }, { id: "users", label: t.tabUsers }].map(tab => (
                    <button key={tab.id} onClick={() => setUsersTab(tab.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${usersTab === tab.id ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Overview */}
                {usersTab === "overview" && storeStats && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: t.totalUsers,         value: storeStats.totalUsers,         icon: Users,        color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
                        { label: t.statTodayRevenue,   value: fmt(storeStats.todayRevenue),  icon: DollarSign,   color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20" },
                        { label: t.statTodayOrders,    value: storeStats.todayOrders,        icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
                        { label: t.statMonthRevenue,   value: fmt(storeStats.monthRevenue),  icon: TrendingUp,   color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
                        { label: t.statMonthOrders,    value: storeStats.monthOrders,        icon: Activity,     color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20" },
                        { label: t.statTotalRevenue,   value: fmt(storeStats.totalRevenue),  icon: DollarSign,   color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20" },
                        { label: t.statTotalOrders,    value: storeStats.totalOrders,        icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
                        { label: t.statTotalProducts,  value: storeStats.totalProducts,      icon: Package,      color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20" },
                      ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className={`${bg} rounded-2xl p-4 border border-white/50 dark:border-white/5`}>
                          <div className="flex items-center gap-2 mb-1"><Icon size={13} className={color}/><p className="text-xs text-gray-500">{label}</p></div>
                          <p className={`text-xl font-bold ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {storeStats.topUsers?.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-3 border-b dark:border-gray-700 flex items-center gap-2">
                          <TrendingUp size={14} className="text-amber-500"/>
                          <span className="font-semibold text-sm">{t.topPerforming}</span>
                        </div>
                        <div className="divide-y dark:divide-gray-700">
                          {storeStats.topUsers.map((u, i) => (
                            <div key={u._id} className="flex items-center justify-between px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{i+1}</span>
                                <span className="text-sm font-medium">{u.username}</span>
                              </div>
                              <div className="flex gap-6 text-sm">
                                <span className="text-gray-500">{u.orders} {t.orders}</span>
                                <span className="font-semibold text-green-600">{fmt(u.revenue)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Users list */}
                {usersTab === "users" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input placeholder={t.searchUsers} value={usersSearch} onChange={e => setUsersSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:border-blue-400"/>
                    </div>

                    {showUserForm && (
                      <form onSubmit={handleCreateStoreUser} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 grid sm:grid-cols-4 gap-3">
                        <input placeholder={t.usernameLabel} required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                        <input placeholder={t.btnPassword} type="password" required value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                        <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-sm outline-none">
                          <option value="cashier">{t.roleCashier}</option>
                          <option value="admin">{t.roleAdmin}</option>
                        </select>
                        <button className="bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold py-2">{t.create}</button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {filteredUsers.map(u => (
                        <div key={u._id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
                          <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
                            {/* Avatar */}
                            <div className="flex items-center gap-3 flex-1 min-w-48">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === "admin" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-200 dark:bg-gray-700 text-gray-600"}`}>
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                                {u.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"/>}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm">{u.username}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>{u.role}</span>
                                  {!u.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">{t.disabled}</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{t.joined} {new Date(u.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {/* Device cap */}
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl px-3 py-2">
                              <Smartphone size={13} className="text-blue-500"/>
                              <span className="text-xs text-gray-500 whitespace-nowrap">Max devices</span>
                              <button onClick={() => handleUpdateMaxDevices(u, (u.maxDevices||1)-1)} disabled={(u.maxDevices||1) <= 1} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30"><Minus size={11}/></button>
                              <span className="text-sm font-bold w-4 text-center">{u.maxDevices || 1}</span>
                              <button onClick={() => handleUpdateMaxDevices(u, (u.maxDevices||1)+1)} disabled={(u.maxDevices||1) >= 10} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30"><Plus size={11}/></button>
                              <span className="text-xs text-gray-400">({u.activeDevices || 0} {t.onlineStatus})</span>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-5 text-sm">
                              <div className="text-center"><p className="font-semibold text-green-600">{fmt(u.stats?.totalRevenue)}</p><p className="text-xs text-gray-400">{t.statTotalRevenue}</p></div>
                              <div className="text-center"><p className="font-semibold">{u.stats?.totalOrders || 0}</p><p className="text-xs text-gray-400">{t.statTotalOrders}</p></div>
                            </div>

                            {/* Online */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {u.isOnline ? <><Wifi size={12} className="text-green-500"/><span className="text-green-600">{u.activeDevices} {t.onlineStatus}</span></> : <><WifiOff size={12}/><span>{timeAgo(u.lastLoginAt)}</span></>}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-auto flex-wrap">
                              <button onClick={() => handleViewSales(u)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition"><Eye size={11}/> {t.btnSales}</button>
                              <button onClick={() => { setUserPwModal(u); setUserNewPin(""); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 transition"><KeyRound size={11}/> {t.btnPassword}</button>
                              {u.isOnline && <button onClick={() => handleForceLogout(u)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition"><LogOut size={11}/> {t.btnKickAll}</button>}
                              <button onClick={() => handleToggleStoreUser(u)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition ${u.active ? "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100" : "bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100"}`}>
                                {u.active ? <><XCircle size={11}/> {t.btnDisable}</> : <><CheckCircle size={11}/> {t.btnEnable}</>}
                              </button>
                              <button onClick={() => handleDeleteStoreUser(u)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"><Trash2 size={14}/></button>
                              <button onClick={() => setExpandedUser(p => ({ ...p, [u._id]: !p[u._id] }))} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                {expandedUser[u._id] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </div>

                          {/* Expanded */}
                          {expandedUser[u._id] && (
                            <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-900">
                              {u.devices?.length > 0 && (
                                <div className="px-5 py-4 border-b dark:border-gray-700">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Smartphone size={11}/> {t.devicesLabel} ({u.devices.length}/{u.maxDevices||1})</p>
                                  <div className="grid sm:grid-cols-3 gap-3">
                                    {u.devices.map((d, i) => (
                                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                        <Monitor size={14} className="text-blue-500 shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">{d.deviceName || "Unknown"}</p>
                                          <p className="text-xs text-gray-400">{d.deviceOS} · {timeAgo(d.lastLoginAt)}</p>
                                        </div>
                                        <button onClick={() => handleKickDevice(u, d.deviceId, d.deviceName)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition shrink-0"><LogOut size={12}/></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Danger zone */}
                              <div className="px-5 py-4 bg-red-50/50 dark:bg-red-900/5 border-t border-red-100 dark:border-red-500/10">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Trash2 size={11}/> {t.dangerZone}</p>
                                <div className="flex flex-wrap gap-2">
                                  <button onClick={() => handleClearUserSales(u)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 transition">
                                    <Trash2 size={11}/> {t.clearAllSales} <span className="opacity-60">({u.stats?.totalOrders || 0} {t.orders})</span>
                                  </button>
                                  <button onClick={() => handleClearUserProducts(u)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 transition">
                                    <Trash2 size={11}/> {t.clearAllProducts}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredUsers.length === 0 && <div className="text-center text-gray-400 py-8">{t.noUsersFound}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ ALL OTHER MODALS ════ */}

      {/* Create Store */}
      {createModal && (
        <Modal title={t.modalCreateStore} onClose={() => setCreateModal(false)}>
          <div className="space-y-3">
            {[{ label: t.fieldStoreName, key: "storeName", ph: "e.g. My Market" }, { label: t.fieldAdminUser, key: "username", ph: "e.g. marketAdmin" }, { label: t.fieldAdminPass, key: "password", ph: "e.g. 123456" }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{f.label}</label>
                <input type="text" placeholder={f.ph} value={createForm[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.fieldPlan}</label>
                <select value={createForm.plan} onChange={e => setCreateForm(p => ({ ...p, plan: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {["trial", "basic", "pro", "enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.fieldCurrency}</label>
                <select value={createForm.currency} onChange={e => setCreateForm(p => ({ ...p, currency: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {["USD", "EUR", "GBP", "LBP", "SAR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateStore} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700">{t.btnCreateStore}</button>
              <button onClick={() => setCreateModal(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Editor */}
      {editingPlan && (
        <Modal title={`${t.modalEditPlan} — ${editingPlan.name}`} onClose={() => setEditingPlan(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.fieldPlan}</label>
              <select value={planForm.plan} onChange={handlePlanChange} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {["trial", "basic", "pro", "enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: t.fieldMaxUsers, key: "maxUsers" }, { label: t.fieldMaxProducts, key: "maxProducts" }].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{f.label}</label>
                  <input type="number" min="1" value={planForm[f.key]} onChange={e => setPlanForm(p => ({ ...p, [f.key]: +e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.fieldExpiresAt}</label>
              <input type="date" value={planForm.expiresAt} onChange={e => setPlanForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.fieldMonthlyPrice}</label>
              <input type="number" min="0" step="0.01" placeholder="e.g. 29.99" value={planForm.monthlyPrice} onChange={e => setPlanForm(p => ({ ...p, monthlyPrice: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={savePlan} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700">{t.btnSavePlan}</button>
              <button onClick={() => setEditingPlan(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password */}
      {resetTarget && (
        <Modal title={`${t.modalResetPw} — ${resetTarget.name}`} onClose={() => setResetTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t.resetPwDesc} <strong>{resetTarget.name}</strong></p>
            <input type="text" placeholder={t.fieldNewPassword} value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <div className="flex gap-3">
              <button onClick={handleResetPW} className="flex-1 bg-yellow-500 text-white rounded-xl py-2.5 font-medium hover:bg-yellow-600">{t.btnReset}</button>
              <button onClick={() => setResetTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notify */}
      {notifyTarget && (
        <Modal title={`${t.modalNotify} — ${notifyTarget.name}`} onClose={() => setNotifyTarget(null)}>
          <div className="space-y-3">
            <textarea rows={3} placeholder={t.fieldMessage} value={notifyForm.message} onChange={e => setNotifyForm(f => ({ ...f, message: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />
            <select value={notifyForm.type} onChange={e => setNotifyForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["info", "warning", "success", "error"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleNotify} className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700">{t.btnSend}</button>
              <button onClick={() => setNotifyTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Notify */}
      {bulkNotifyModal && (
        <Modal title={`${t.modalBulkNotify} (${selected.length || "all"} ${t.stores})`} onClose={() => setBulkNotifyModal(false)}>
          <div className="space-y-3">
            <textarea rows={3} placeholder={t.fieldMessage} value={bulkNotifyForm.message} onChange={e => setBulkNotifyForm(f => ({ ...f, message: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />
            <select value={bulkNotifyForm.type} onChange={e => setBulkNotifyForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["info", "warning", "success", "error"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleBulkNotify} className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700">{t.btnSend}</button>
              <button onClick={() => setBulkNotifyModal(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clone */}
      {cloneTarget && (
        <Modal title={`${t.modalClone} — ${cloneTarget.name}`} onClose={() => setCloneTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t.cloneDesc}</p>
            {[{ label: t.fieldNewStoreName, key: "newStoreName", ph: "e.g. My Market 2" }, { label: t.fieldNewAdminUser, key: "newUsername", ph: "e.g. admin2" }, { label: t.fieldNewAdminPass, key: "newPassword", ph: "e.g. 123456" }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{f.label}</label>
                <input type="text" placeholder={f.ph} value={cloneForm[f.key]} onChange={e => setCloneForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={handleClone} className="flex-1 bg-cyan-600 text-white rounded-xl py-2.5 font-medium hover:bg-cyan-700">{t.btnCloneStore}</button>
              <button onClick={() => setCloneTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer */}
      {transferTarget && (
        <Modal title={`${t.modalTransfer} — ${transferTarget.name}`} onClose={() => setTransferTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t.transferDesc}</p>
            {[{ label: t.fieldNewAdminUser, key: "newUsername", ph: "e.g. newAdmin" }, { label: t.fieldNewAdminPass, key: "newPassword", ph: "e.g. 123456" }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{f.label}</label>
                <input type="text" placeholder={f.ph} value={transferForm[f.key]} onChange={e => setTransferForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={handleTransfer} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 font-medium hover:bg-orange-600">{t.btnTransferStore}</button>
              <button onClick={() => setTransferTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Welcome Message */}
      {welcomeTarget && (
        <Modal title={`${t.modalWelcome} — ${welcomeTarget.name}`} onClose={() => setWelcomeTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t.welcomeDesc}</p>
            <textarea rows={3} placeholder={t.welcomePh} value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />
            <div className="flex gap-3">
              <button onClick={handleWelcome} className="flex-1 bg-pink-600 text-white rounded-xl py-2.5 font-medium hover:bg-pink-700">{t.btnSave}</button>
              <button onClick={() => setWelcomeTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Internal Notes */}
      {notesTarget && (
        <Modal title={`${t.modalNotes} — ${notesTarget.name}`} onClose={() => setNotesTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t.notesDesc}</p>
            <textarea rows={4} placeholder={t.notesPh} value={notesText} onChange={e => setNotesText(e.target.value)} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />
            <div className="flex gap-3">
              <button onClick={handleNotes} className="flex-1 bg-amber-500 text-white rounded-xl py-2.5 font-medium hover:bg-amber-600">{t.btnSaveNotes}</button>
              <button onClick={() => setNotesTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Store Confirm */}
      {deleteTarget && (
        <Modal title={t.modalDelete} onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">Delete <strong>{deleteTarget.name}</strong>? {t.deleteDesc}</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteStore} className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-medium hover:bg-red-700">{t.btnConfirmDelete}</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 font-medium dark:bg-gray-700 dark:text-gray-300">{t.cancel}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Store Details */}
      {detailStore && (
        <Modal title={`${t.modalDetails} — ${detailStore.name}`} onClose={() => { setDetailStore(null); setDetailData(null); }} wide>
          {detailLoading ? <div className="flex justify-center py-8 text-gray-400">{t.detailLoading}</div> : detailData ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[{ label: t.stat30dSales, value: `$${detailData.last30DaysSales.toFixed(2)}` }, { label: t.stat30dOrders, value: detailData.last30DaysOrders }, { label: t.statProducts, value: detailData.productCount }].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <div className="font-bold text-gray-800 dark:text-white">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t.detailUsers} ({detailData.users.length})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {detailData.users.map(u => (
                    <div key={u._id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium">{u.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{u.role}</span>
                      <span className="text-xs text-gray-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : t.never}</span>
                    </div>
                  ))}
                </div>
              </div>
              {detailData.recentSales?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t.detailRecentSales}</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {detailData.recentSales.map(sale => (
                      <div key={sale._id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500">{sale.items?.length || 0} items · {sale.paymentMethod}</span>
                        <span className="font-medium">${sale.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <div className="text-center text-gray-400 py-8">{t.noData}</div>}
        </Modal>
      )}

      {/* User Change Password Modal */}
      {userPwModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setUserPwModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">{t.modalChangePw} — <span className="text-blue-500">{userPwModal.username}</span></h2>
              <button onClick={() => setUserPwModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <input type="password" placeholder={t.newPwPh} value={userNewPin} onChange={e => setUserNewPin(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"/>
            <button onClick={handleChangeUserPW} disabled={userNewPin.length < 4} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition">{t.btnUpdatePw}</button>
          </div>
        </div>
      )}

      {/* User Sales Modal */}
      {userSalesModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setUserSalesModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b dark:border-white/10">
              <div>
                <h2 className="font-bold">{t.modalSales} — <span className="text-blue-500">{userSalesModal.username}</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">{t.last50Tx}</p>
              </div>
              <button onClick={() => setUserSalesModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="overflow-y-auto max-h-96 divide-y dark:divide-white/5">
              {userSales.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">{t.noSalesYet}</p>
                : userSales.map(s => (
                  <div key={s._id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">${s.total?.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.paymentMethod === "cash" ? "bg-green-100 text-green-600" : s.paymentMethod === "card" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>{s.paymentMethod}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{s.items?.length || 0} items</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}