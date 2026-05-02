import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLang } from "../context/LanguageContext";
import {
  LayoutDashboard, ShoppingCart, Package, Tags, Users, BarChart3,
  Clock, Sun, Moon, LogOut, Pencil, Check, X, Shield, Store,
  UserCircle2, ClipboardList, TrendingDown, Tag, Truck, Globe,
} from "lucide-react";
import { useTheme }  from "../context/ThemeContext";
import { useAuth }   from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsBell from "../components/NotificationsBell";
import toast from "react-hot-toast";

const NAV_LABELS = {
  dashboard:       "Dashboard",
  pos:             "POS",
  products:        "Products",
  categories:      "Categories",
  users:           "Users",
  reports:         "Reports",
  paylater:        "Pay Later",
  customers:       "Customers",
  shift:           "Shift / Z-Report",
  adminpanel:      "Admin Panel",
  storesettings:   "Store Settings",
  stock:           "Stock",
  expenses:        "Expenses",
  discounts:       "Discounts",
  suppliers:       "Suppliers",
  superadminpanel: "Super Admin",
  onlineorders:    "Online Orders",
  pendingpayments: "Pending Payments",
};

const NAV_COLORS = {
  dashboard:       { bg: "#6366f1", glow: "rgba(99,102,241,0.5)"   },
  pos:             { bg: "#10b981", glow: "rgba(16,185,129,0.5)"   },
  products:        { bg: "#3b82f6", glow: "rgba(59,130,246,0.5)"   },
  categories:      { bg: "#f59e0b", glow: "rgba(245,158,11,0.5)"   },
  users:           { bg: "#ec4899", glow: "rgba(236,72,153,0.5)"   },
  reports:         { bg: "#8b5cf6", glow: "rgba(139,92,246,0.5)"   },
  paylater:        { bg: "#ef4444", glow: "rgba(239,68,68,0.5)"    },
  customers:       { bg: "#0ea5e9", glow: "rgba(14,165,233,0.5)"   },
  shift:           { bg: "#4f46e5", glow: "rgba(79,70,229,0.5)"    },
  adminpanel:      { bg: "#0f172a", glow: "rgba(15,23,42,0.6)"     },
  storesettings:   { bg: "#6366f1", glow: "rgba(99,102,241,0.5)"   },
  stock:           { bg: "#0891b2", glow: "rgba(8,145,178,0.5)"    },
  expenses:        { bg: "#dc2626", glow: "rgba(220,38,38,0.5)"    },
  discounts:       { bg: "#16a34a", glow: "rgba(22,163,74,0.5)"    },
  suppliers:       { bg: "#7c3aed", glow: "rgba(124,58,237,0.5)"   },
  superadminpanel: { bg: "#7c3aed", glow: "rgba(124,58,237,0.5)"   },
  onlineorders:    { bg: "#0284c7", glow: "rgba(2,132,199,0.5)"    },
  pendingpayments: { bg: "#ea580c", glow: "rgba(234,88,12,0.5)"    },
};

export default function DashboardLayout({ children, page, setPage, user }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang }   = useLang();
  const { logout, storeName, updateStore, store } = useAuth();

  const isAdmin      = user?.role === "admin";
  const isSuperAdmin = user?.role === "superadmin";
  const isPOS        = page === "pos";

  const [open,       setOpen]       = useState(false);
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const navRef                      = useRef(null);

  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState("");
  const [savingName,  setSavingName]  = useState(false);
  const nameInputRef = useRef(null);

  const startEditName  = (e) => { e.stopPropagation(); setNameInput(storeName); setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50); };
  const cancelEditName = (e) => { e?.stopPropagation(); setEditingName(false); };
  const saveEditName   = async (e) => {
    e?.stopPropagation();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try { await updateStore({ name: nameInput.trim() }); toast.success("Store name updated"); setEditingName(false); }
    catch { toast.error("Failed to update store name"); }
    finally { setSavingName(false); }
  };

  const menu = isSuperAdmin
    ? [{ key: "superadminpanel", icon: Globe }]
    : [
        { key: "dashboard",     icon: LayoutDashboard, adminOnly: true  },
        { key: "pos",           icon: ShoppingCart,    adminOnly: false },
        { key: "products",      icon: Package,         adminOnly: false },
        { key: "categories",    icon: Tags,            adminOnly: false },
        { key: "customers",     icon: UserCircle2,     adminOnly: false },
        { key: "users",         icon: Users,           adminOnly: true  },
        { key: "reports",       icon: BarChart3,       adminOnly: false },
        { key: "paylater",      icon: Clock,           adminOnly: false },
        { key: "shift",         icon: ClipboardList,   adminOnly: false },
        { key: "stock",         icon: TrendingDown,    adminOnly: true  },
        { key: "expenses",      icon: TrendingDown,    adminOnly: true  },
        { key: "discounts",     icon: Tag,             adminOnly: true  },
        { key: "suppliers",     icon: Truck,           adminOnly: true  },
        { key: "onlineorders",    icon: Globe,           adminOnly: true  },
        { key: "pendingpayments", icon: Truck,           adminOnly: false },
        { key: "adminpanel",      icon: Shield,          adminOnly: true  },
        { key: "storesettings",   icon: Store,           adminOnly: true  },
      ].filter(item => !item.adminOnly || isAdmin);

  // Split menu into two columns if long
  const half   = Math.ceil(menu.length / 2);
  const col1   = menu.slice(0, half);
  const col2   = menu.slice(half);

  const toggle  = useCallback(() => setOpen(v => !v), []);
  const close   = useCallback(() => { setOpen(false); setEditingName(false); }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      if ((e.key === "`" || e.key === "F1" || (e.key === "s" && !isTyping && !e.ctrlKey && !e.metaKey))) {
        e.preventDefault(); toggle();
      }
      if (e.key === "Escape") close();
      const idx = parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < menu.length && open) { setPage(menu[idx].key); close(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, menu, toggle, close, setPage]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (navRef.current && !navRef.current.contains(e.target)) close(); };
    setTimeout(() => document.addEventListener("mousedown", onClickOutside), 0);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, close]);

  const activeColor = NAV_COLORS[page] || NAV_COLORS.pos;
  const welcomeMsg  = store?.welcomeMessage;

  const NavItem = ({ item, index }) => {
    const Icon   = item.icon;
    const active = page === item.key;
    const color  = NAV_COLORS[item.key];

    return (
      <motion.button
        key={item.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 28 }}
        onClick={() => { setPage(item.key); close(); }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left
          transition-all duration-150 relative overflow-hidden
          ${active
            ? "text-white shadow-lg"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
          }
        `}
        style={active ? {
          background: color.bg,
          boxShadow: `0 4px 14px ${color.glow}`,
        } : {}}
      >
        {/* Icon bubble */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: active ? "rgba(255,255,255,0.2)" : color.bg + "22",
          }}
        >
          <Icon size={14} style={{ color: active ? "white" : color.bg }} />
        </div>

        {/* Label */}
        <span className="text-xs font-semibold truncate flex-1">
          {NAV_LABELS[item.key]}
        </span>

        {/* Keyboard shortcut */}
        <span className={`text-[10px] font-mono shrink-0 ${active ? "text-white/60" : "text-gray-300 dark:text-gray-600"}`}>
          {index + 1}
        </span>

        {/* Active pulse */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: color.bg }}
            animate={{ opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white overflow-hidden">

      {welcomeMsg && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-blue-600 text-white text-center text-xs py-1.5 px-4">
          💬 {welcomeMsg}
        </div>
      )}

      {/* ── FLOATING NAV ── */}
      <div ref={navRef} className="fixed bottom-5 left-5 z-50">

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="absolute bottom-16 left-0 w-[420px]
                bg-white/95 dark:bg-[#1a1a1a]/95
                backdrop-blur-xl
                rounded-2xl shadow-2xl
                border border-gray-100 dark:border-white/8
                overflow-hidden"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              {/* Header: user + store */}
              <div className="flex items-center justify-between gap-3 px-4 py-3
                border-b border-gray-100 dark:border-white/8
                bg-gray-50/80 dark:bg-white/3">

                {/* User */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: activeColor.bg }}>
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{user?.username}</p>
                    <p className="text-[10px] capitalize text-blue-500">{user?.role}</p>
                  </div>
                </div>

                {/* Store name (editable) */}
                {!isSuperAdmin && (
                  <div className="flex-1 flex justify-end min-w-0">
                    {editingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={nameInputRef}
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") saveEditName(); if (e.key === "Escape") cancelEditName(); }}
                          className="text-[11px] font-semibold bg-transparent border-b border-blue-500 outline-none text-gray-800 dark:text-white w-28"
                          placeholder="Store name…"
                        />
                        <button onClick={saveEditName} disabled={savingName} className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"><Check size={11}/></button>
                        <button onClick={cancelEditName} className="p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"><X size={11}/></button>
                      </div>
                    ) : (
                      <button onClick={startEditName} className="group flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition truncate max-w-[140px]">
                        🧾 {storeName}
                        <Pencil size={9} className="shrink-0 opacity-0 group-hover:opacity-100 transition text-blue-400"/>
                      </button>
                    )}
                  </div>
                )}

                {isSuperAdmin && (
                  <span className="text-[11px] font-semibold text-purple-500">🌐 Platform</span>
                )}
              </div>

              {/* Nav grid — two columns */}
              <div className="p-3 grid grid-cols-2 gap-1.5">
                {menu.map((item, i) => (
                  <NavItem key={item.key} item={item} index={i} />
                ))}
              </div>

              {/* Utility row */}
              <div className="flex items-center justify-between gap-2 px-4 py-2.5
                border-t border-gray-100 dark:border-white/8
                bg-gray-50/80 dark:bg-white/3">

                <div className="flex items-center gap-1.5">
                  {/* Theme */}
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                      bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10
                      text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    title="Toggle theme"
                  >
                    {theme === "dark" ? <Sun size={13} className="text-amber-400"/> : <Moon size={13}/>}
                  </motion.button>

                  {/* Language */}
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleLang}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                      bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10
                      text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    title="Switch language"
                  >
                    {lang === "en" ? "AR" : "EN"}
                  </motion.button>

                  {/* Notifications */}
                  {!isSuperAdmin && <NotificationsBell />}
                </div>

                {/* Logout */}
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20
                    hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut size={12}/> Logout
                </motion.button>
              </div>

              {/* Keyboard hint */}
              <div className="px-4 py-2 border-t border-gray-50 dark:border-white/5">
                <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/8 font-mono text-[9px]">S</kbd> or <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/8 font-mono text-[9px]">`</kbd> toggle · <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/8 font-mono text-[9px]">1–{menu.length}</kbd> jump · <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/8 font-mono text-[9px]">Esc</kbd> close
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TRIGGER BUTTON ── */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-xl focus:outline-none"
          style={{
            background: open ? "#1e1e2e" : activeColor.bg,
            boxShadow: open
              ? "0 0 0 2px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.4)"
              : `0 0 0 3px white, 0 0 24px ${activeColor.glow}, 0 8px 24px ${activeColor.glow}`,
          }}
          title="Navigation (` or F1)"
        >
          <motion.div animate={{ rotate: open ? 45 : 0, scale: open ? 0.8 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            {open ? (
              <X size={18} color="white"/>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="4"  cy="4"  r="2" fill="white"/>
                <circle cx="9"  cy="4"  r="2" fill="white" fillOpacity="0.7"/>
                <circle cx="14" cy="4"  r="2" fill="white" fillOpacity="0.4"/>
                <circle cx="4"  cy="9"  r="2" fill="white" fillOpacity="0.7"/>
                <circle cx="9"  cy="9"  r="2" fill="white"/>
                <circle cx="14" cy="9"  r="2" fill="white" fillOpacity="0.7"/>
                <circle cx="4"  cy="14" r="2" fill="white" fillOpacity="0.4"/>
                <circle cx="9"  cy="14" r="2" fill="white" fillOpacity="0.7"/>
                <circle cx="14" cy="14" r="2" fill="white"/>
              </svg>
            )}
          </motion.div>

          {/* Pulse ring */}
          {!open && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: activeColor.bg }}
              animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 overflow-hidden ${!isPOS ? "overflow-y-auto p-6 pb-10" : ""} ${(welcomeMsg || !isOnline) ? "pt-9" : ""}`}>
        {children}
      </main>
    </div>
  );
}
