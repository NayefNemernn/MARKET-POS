import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";
import toast from "react-hot-toast";
import {
  Shield, Users, TrendingUp, Package, ShoppingCart,
  Monitor, Clock, Wifi, WifiOff, KeyRound, Trash2,
  LogOut, BarChart3, Search, UserPlus, X, Eye,
  CheckCircle, XCircle, DollarSign, Activity, Globe,
  ChevronDown, ChevronUp, RefreshCw, Smartphone, Plus, Minus
} from "lucide-react";

export default function AdminPanel() {
  const [users, setUsers]           = useState([]);
  const [globalStats, setGlobal]    = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ username: "", password: "", role: "cashier" });
  const [pwModal, setPwModal]       = useState(null);
  const [newPin, setNewPin]         = useState("");
  const [salesModal, setSalesModal] = useState(null);
  const [sales, setSales]           = useState([]);
  const [expanded, setExpanded]     = useState({});
  const [tab, setTab]               = useState("overview");

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/users"),
        api.get("/users/admin/global-stats"),
      ]);
      setUsers(usersRes.data);
      setGlobal(statsRes.data);
    } catch { toast.error("Failed to load admin data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const clearSales = async (user) => {
    if (!confirm(`⚠️ Delete ALL sales for "${user.username}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/users/${user._id}/clear-sales`);
      toast.success(res.data.message);
      load();
    } catch { toast.error("Failed to clear sales"); }
  };

  const clearProducts = async (user) => {
    if (!confirm(`⚠️ Delete ALL products for "${user.username}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/users/${user._id}/clear-products`);
      toast.success(res.data.message);
      load();
    } catch { toast.error("Failed to clear products"); }
  };

  const clearAll = async (user) => {
    if (!confirm(`🚨 Delete ALL sales AND products for "${user.username}"?\n\nThis will permanently erase all their data. Type the username to confirm.`)) return;
    const input = prompt(`Type "${user.username}" to confirm:`);
    if (input !== user.username) { toast.error("Username did not match — cancelled"); return; }
    try {
      const res = await api.delete(`/users/${user._id}/clear-all`);
      toast.success(res.data.message);
      load();
    } catch { toast.error("Failed to clear data"); }
  };

  const fetchUserSales = async (user) => {
    setSalesModal(user);
    try {
      const res = await api.get(`/users/${user._id}/sales`);
      setSales(res.data);
    } catch { toast.error("Failed to load sales"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      setForm({ username: "", password: "", role: "cashier" });
      setShowForm(false);
      toast.success("User created");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const toggleStatus = async (user) => {
    await api.patch(`/users/${user._id}`, { active: !user.active });
    toast.success(`${user.username} ${user.active ? "disabled" : "enabled"}`);
    load();
  };

  const forceLogout = async (user) => {
    await api.post(`/users/${user._id}/force-logout`);
    toast.success(`${user.username} logged out from all devices`);
    load();
  };

  const forceLogoutDevice = async (userId, deviceId, deviceName) => {
    await api.post(`/users/${userId}/force-logout-device`, { deviceId });
    toast.success(`Device "${deviceName}" kicked`);
    load();
  };

  const updateMaxDevices = async (user, newMax) => {
    if (newMax < 1 || newMax > 10) return;
    await api.patch(`/users/${user._id}`, { maxDevices: newMax });
    toast.success(`${user.username} can now use ${newMax} device${newMax > 1 ? "s" : ""}`);
    load();
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    await api.delete(`/users/${user._id}`);
    toast.success("User deleted");
    load();
  };

  const changePassword = async () => {
    if (newPin.length < 4) { toast.error("Minimum 4 characters"); return; }
    try {
      await api.post(`/users/${pwModal._id}/change-password`, { newPassword: newPin });
      toast.success(`Password changed for ${pwModal.username}`);
      setPwModal(null); setNewPin("");
    } catch { toast.error("Failed to change password"); }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const fmt     = (n) => `$${Number(n || 0).toFixed(2)}`;
  const timeAgo = (date) => {
    if (!date) return "Never";
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)    return "Just now";
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return (
    <RequireAdmin>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    </RequireAdmin>
  );

  return (
    <RequireAdmin>
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950">
        <div className="p-5 space-y-5 max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Shield size={20} className="text-white"/>
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Control Panel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Full system overview — admin only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10
                hover:bg-gray-50 dark:hover:bg-[#1c1c1c] transition text-gray-600 dark:text-gray-300">
                <RefreshCw size={13}/> Refresh
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                  bg-blue-600 hover:bg-blue-700 text-white transition">
                <UserPlus size={14}/> Add User
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-1 p-1 bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/10 w-fit">
            {[
              { id: "overview", label: "Overview",  icon: BarChart3 },
              { id: "users",    label: "All Users", icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${tab === id ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
                <Icon size={14}/> {label}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ══ */}
          {tab === "overview" && globalStats && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Users",    value: globalStats.totalUsers,         icon: Users,        color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { label: "Online Now",     value: globalStats.activeUsers,        icon: Wifi,         color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20" },
                  { label: "Today Revenue",  value: fmt(globalStats.todayRevenue),  icon: DollarSign,   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20" },
                  { label: "Today Orders",   value: globalStats.todayOrders,        icon: ShoppingCart, color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/20" },
                  { label: "Month Revenue",  value: fmt(globalStats.monthRevenue),  icon: TrendingUp,   color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { label: "Month Orders",   value: globalStats.monthOrders,        icon: Activity,     color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20" },
                  { label: "Total Revenue",  value: fmt(globalStats.totalRevenue),  icon: DollarSign,   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20" },
                  { label: "Total Products", value: globalStats.totalProducts,      icon: Package,      color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/20" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl p-4 border border-white/50 dark:border-white/5`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className={color}/>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Top users */}
              {globalStats.topUsers?.length > 0 && (
                <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                    <TrendingUp size={15} className="text-amber-500"/>
                    <span className="font-semibold text-sm">Top Performing Users</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {globalStats.topUsers.map((u, i) => (
                      <div key={u._id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{u.username}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-gray-500">{u.orders} orders</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{fmt(u.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Online users */}
              <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                  <Wifi size={15} className="text-green-500"/>
                  <span className="font-semibold text-sm">Currently Online</span>
                  <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    {users.filter(u => u.isOnline).length} users online
                  </span>
                </div>
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.filter(u => u.isOnline).length === 0
                    ? <p className="text-sm text-gray-400 col-span-3 py-4 text-center">No users online right now</p>
                    : users.filter(u => u.isOnline).map(u => (
                      <div key={u._id} className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center font-bold text-green-700 dark:text-green-300">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#141414]"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{u.username}</p>
                            <p className="text-xs text-gray-500">{u.activeDevices || 0}/{u.maxDevices || 1} devices</p>
                          </div>
                          <button onClick={() => forceLogout(u)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                            title="Force logout all devices">
                            <LogOut size={13}/>
                          </button>
                        </div>
                        {/* Show each device */}
                        {u.devices?.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-500 py-1 border-t border-green-200/50 dark:border-green-500/10">
                            <span className="flex items-center gap-1 truncate">
                              <Monitor size={10}/> {d.deviceName || "Unknown"}
                            </span>
                            <button onClick={() => forceLogoutDevice(u._id, d.deviceId, d.deviceName)}
                              className="text-red-400 hover:text-red-600 transition ml-2 shrink-0">
                              <X size={11}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {tab === "users" && (
            <div className="space-y-4">

              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none
                    bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10
                    focus:border-blue-400 transition"/>
              </div>

              {/* Add user form */}
              {showForm && (
                <form onSubmit={handleCreate}
                  className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 grid sm:grid-cols-4 gap-3">
                  <input placeholder="Username" required value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  <input placeholder="Password" type="password" required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#141414] text-sm outline-none">
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold py-2">
                    Create User
                  </button>
                </form>
              )}

              {/* Users list */}
              <div className="space-y-3">
                {filtered.map(user => (
                  <div key={user._id} className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">

                    {/* Main row */}
                    <div className="flex items-center gap-4 px-5 py-4 flex-wrap">

                      {/* Avatar */}
                      <div className="flex items-center gap-3 flex-1 min-w-48">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${user.role === "admin" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          {user.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#141414]"/>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{user.username}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${user.role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                              {user.role}
                            </span>
                            {!user.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 font-medium">Disabled</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* ── DEVICE CAP CONTROL ── */}
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                        <Smartphone size={13} className="text-blue-500 shrink-0"/>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Max devices</span>
                        <button onClick={() => updateMaxDevices(user, (user.maxDevices || 1) - 1)}
                          disabled={(user.maxDevices || 1) <= 1}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10
                            flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition">
                          <Minus size={11}/>
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{user.maxDevices || 1}</span>
                        <button onClick={() => updateMaxDevices(user, (user.maxDevices || 1) + 1)}
                          disabled={(user.maxDevices || 1) >= 10}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10
                            flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition">
                          <Plus size={11}/>
                        </button>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          ({user.activeDevices || 0} active)
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-green-600 dark:text-green-400">{fmt(user.stats?.totalRevenue)}</p>
                          <p className="text-xs text-gray-400">Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{user.stats?.totalOrders || 0}</p>
                          <p className="text-xs text-gray-400">Orders</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-blue-500">{user.stats?.totalProducts || 0}</p>
                          <p className="text-xs text-gray-400">Products</p>
                        </div>
                      </div>

                      {/* Device status */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 min-w-36">
                        {user.isOnline
                          ? <><Wifi size={12} className="text-green-500 shrink-0"/><span className="text-green-600 dark:text-green-400">{user.activeDevices} device{user.activeDevices !== 1 ? "s" : ""} online</span></>
                          : <><WifiOff size={12} className="shrink-0"/><span>{user.lastLoginAt ? `Last: ${timeAgo(user.lastLoginAt)}` : "Never"}</span></>
                        }
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <button onClick={() => fetchUserSales(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                          <Eye size={11}/> Sales
                        </button>
                        <button onClick={() => { setPwModal(user); setNewPin(""); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition">
                          <KeyRound size={11}/> Password
                        </button>
                        {user.isOnline && (
                          <button onClick={() => forceLogout(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                              bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition">
                            <LogOut size={11}/> Kick All
                          </button>
                        )}
                        <button onClick={() => toggleStatus(user)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                            ${user.active ? "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100" : "bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100"}`}>
                          {user.active ? <><XCircle size={11}/> Disable</> : <><CheckCircle size={11}/> Enable</>}
                        </button>
                        <button onClick={() => deleteUser(user)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition">
                          <Trash2 size={14}/>
                        </button>
                        <button onClick={() => setExpanded(p => ({ ...p, [user._id]: !p[user._id] }))}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                          {expanded[user._id] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: device list + details */}
                    {expanded[user._id] && (
                      <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20">

                        {/* Active devices */}
                        {user.devices?.length > 0 && (
                          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <Smartphone size={11}/> Active Devices ({user.devices.length}/{user.maxDevices || 1})
                            </p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {user.devices.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-white/5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                    <Monitor size={14} className="text-blue-500"/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{d.deviceName || "Unknown"}</p>
                                    <p className="text-xs text-gray-400">{d.deviceOS} · {d.deviceBrowser}</p>
                                    <p className="text-xs text-gray-400">{timeAgo(d.lastLoginAt)}</p>
                                  </div>
                                  <button onClick={() => forceLogoutDevice(user._id, d.deviceId, d.deviceName)}
                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition shrink-0"
                                    title="Kick this device">
                                    <LogOut size={12}/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Details grid */}
                        <div className="px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: "Last Login IP",    value: user.lastLoginIP  || "—",       icon: Globe },
                            { label: "Last Login",       value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never", icon: Clock },
                            { label: "Account Created",  value: new Date(user.createdAt).toLocaleString(), icon: Clock },
                            { label: "Today Revenue",    value: fmt(user.stats?.todayRevenue),  icon: DollarSign },
                            { label: "Today Orders",     value: user.stats?.todayOrders || 0,   icon: ShoppingCart },
                            { label: "Total Revenue",    value: fmt(user.stats?.totalRevenue),  icon: DollarSign },
                            { label: "Store Name",       value: user.storeName || "Market POS", icon: Package },
                            { label: "Device Cap",       value: `${user.maxDevices || 1} device${(user.maxDevices||1)>1?"s":""}`, icon: Smartphone },
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon size={11} className="text-gray-400"/>
                                <p className="text-xs text-gray-400">{label}</p>
                              </div>
                              <p className="text-sm font-medium truncate">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* ── DANGER ZONE ── */}
                        <div className="px-5 py-4 border-t border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-900/5">
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Trash2 size={11}/> Danger Zone — Clear User Data
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => clearSales(user)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                                bg-white dark:bg-[#141414] border border-red-200 dark:border-red-500/30
                                text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                              <Trash2 size={11}/> Clear All Sales
                              <span className="ml-1 opacity-60">({user.stats?.totalOrders || 0} orders)</span>
                            </button>
                            <button onClick={() => clearProducts(user)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                                bg-white dark:bg-[#141414] border border-red-200 dark:border-red-500/30
                                text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                              <Trash2 size={11}/> Clear All Products
                              <span className="ml-1 opacity-60">({user.stats?.totalProducts || 0} products)</span>
                            </button>
                            <button onClick={() => clearAll(user)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                                bg-red-500 hover:bg-red-600 text-white transition shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                              <Trash2 size={11}/> Clear Everything
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {pwModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setPwModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Change Password — <span className="text-blue-500">{pwModal.username}</span></h2>
              <button onClick={() => setPwModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <input type="password" placeholder="New password (min 4 chars)" value={newPin}
              onChange={e => setNewPin(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10
                bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"/>
            <button onClick={changePassword} disabled={newPin.length < 4}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition">
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* SALES HISTORY MODAL */}
      {salesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setSalesModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <h2 className="font-bold">Sales — <span className="text-blue-500">{salesModal.username}</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 50 transactions</p>
              </div>
              <button onClick={() => setSalesModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="overflow-y-auto max-h-96 divide-y divide-gray-100 dark:divide-white/5">
              {sales.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No sales yet</p>
                : sales.map(s => (
                  <div key={s._id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{fmt(s.total)}</p>
                      <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${s.paymentMethod === "cash" ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                        : s.paymentMethod === "card" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"}`}>
                        {s.paymentMethod}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{s.items?.length || 0} items</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

    </RequireAdmin>
  );
}