import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLang } from "../context/LanguageContext";
import {
  LayoutDashboard, ShoppingCart, Package, Tags,
  Users, BarChart3, Clock, Sun, Moon, LogOut, Pencil, Check, X, Shield, Store
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const NAV_LABELS = {
  dashboard: "Dashboard", pos: "POS", products: "Products",
  categories: "Categories", users: "Users", reports: "Reports",
  paylater: "Pay Later", adminpanel: "Admin Panel", storesettings: "Store Settings"
};

const NAV_COLORS = {
  dashboard:  { bg: "#6366f1", glow: "rgba(99,102,241,0.5)"  },
  pos:        { bg: "#10b981", glow: "rgba(16,185,129,0.5)"  },
  products:   { bg: "#3b82f6", glow: "rgba(59,130,246,0.5)"  },
  categories: { bg: "#f59e0b", glow: "rgba(245,158,11,0.5)"  },
  users:      { bg: "#ec4899", glow: "rgba(236,72,153,0.5)"  },
  reports:    { bg: "#8b5cf6", glow: "rgba(139,92,246,0.5)"  },
  paylater:   { bg: "#ef4444", glow: "rgba(239,68,68,0.5)"   },
  adminpanel:    { bg: "#0f172a", glow: "rgba(15,23,42,0.6)"    },
  storesettings: { bg: "#6366f1", glow: "rgba(99,102,241,0.5)" },
};

export default function DashboardLayout({ children, page, setPage, user }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang }   = useLang();
  const { logout, storeName, updateStore } = useAuth();

  const isAdmin = user?.role === "admin";
  const isPOS   = page === "pos";

  const [open,    setOpen]    = useState(false);
  const [hovered, setHovered] = useState(null);
  const hideTimer             = useRef(null);
  const navRef                = useRef(null);

  // Store name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState("");
  const [savingName,  setSavingName]  = useState(false);
  const nameInputRef = useRef(null);

  const startEditName = (e) => {
    e.stopPropagation();
    setNameInput(storeName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const cancelEditName = (e) => {
    e?.stopPropagation();
    setEditingName(false);
  };

  const saveEditName = async (e) => {
    e?.stopPropagation();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateStore({ name: nameInput.trim() });
      toast.success("Store name updated");
      setEditingName(false);
    } catch {
      toast.error("Failed to update store name");
    } finally {
      setSavingName(false);
    }
  };

  const menu = [
    { key: "dashboard",  icon: LayoutDashboard, adminOnly: true  },
    { key: "pos",        icon: ShoppingCart,    adminOnly: false },
    { key: "products",   icon: Package,         adminOnly: false },
    { key: "categories", icon: Tags,            adminOnly: false },
    { key: "users",      icon: Users,           adminOnly: true  },
    { key: "reports",    icon: BarChart3,       adminOnly: false },
    { key: "paylater",   icon: Clock,           adminOnly: false },
    { key: "adminpanel",    icon: Shield,          adminOnly: true  },
    { key: "storesettings", icon: Store,          adminOnly: true  },
  ].filter(item => !item.adminOnly || isAdmin);

  const toggle  = useCallback(() => setOpen(v => !v), []);
  const close   = useCallback(() => { setOpen(false); setEditingName(false); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "`" || e.key === "F1") { e.preventDefault(); toggle(); }
      if (e.key === "Escape") close();
      const idx = parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < menu.length && open) {
        setPage(menu[idx].key);
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, menu]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) close();
    };
    setTimeout(() => document.addEventListener("mousedown", onClickOutside), 0);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const activeColor = NAV_COLORS[page] || NAV_COLORS.pos;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white overflow-hidden">

      {/* FLOATING NAV */}
      <div ref={navRef} className="fixed bottom-5 left-5 z-50">

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute bottom-16 left-0 flex flex-col-reverse items-start gap-0"
            >
              {/* Connector line */}
              <div className="absolute left-[19px] bottom-0 w-[2px] rounded-full"
                style={{
                  height: `${menu.length * 52}px`,
                  background: "linear-gradient(to top, rgba(99,102,241,0.15), rgba(99,102,241,0.4))"
                }}
              />

              {/* Nav balls */}
              {menu.map((item, i) => {
                const Icon   = item.icon;
                const active = page === item.key;
                const color  = NAV_COLORS[item.key];
                const isHov  = hovered === item.key;

                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 28 }}
                    className="relative flex items-center mb-1.5"
                    onMouseEnter={() => setHovered(item.key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <AnimatePresence>
                      {(isHov || active) && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-12 whitespace-nowrap flex items-center gap-2"
                        >
                          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg"
                            style={{ background: color.bg, boxShadow: `0 4px 16px ${color.glow}` }}>
                            {NAV_LABELS[item.key]}
                            <span className="ml-2 opacity-60 text-[10px]">{i + 1}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      onClick={() => { setPage(item.key); close(); }}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all z-10"
                      style={{
                        background: active ? color.bg : "var(--ball-bg, #e5e7eb)",
                        boxShadow: active
                          ? `0 0 0 3px white, 0 0 16px ${color.glow}, 0 0 32px ${color.glow}`
                          : isHov
                          ? `0 0 0 2px ${color.bg}, 0 8px 20px ${color.glow}`
                          : "0 2px 8px rgba(0,0,0,0.12)",
                      }}
                    >
                      <Icon size={16} color={active || isHov ? "white" : theme === "dark" ? "#9ca3af" : "#6b7280"} />
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ background: color.bg }}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Utility row */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ delay: menu.length * 0.04, type: "spring", stiffness: 400, damping: 28 }}
                className="flex items-center gap-2 mb-3 pl-1"
              >
                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-neutral-700 shadow"
                  title="Toggle theme">
                  {theme === "dark" ? <Sun size={13} className="text-amber-400"/> : <Moon size={13} className="text-gray-600"/>}
                </motion.button>

                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={toggleLang}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-neutral-700 shadow text-[10px] font-bold text-gray-700 dark:text-gray-300"
                  title="Switch language">
                  {lang === "en" ? "AR" : "EN"}
                </motion.button>

                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={() => logout()}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/40 shadow"
                  title="Logout">
                  <LogOut size={13} className="text-red-500"/>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TRIGGER BUTTON */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.15 }}
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
          <motion.div
            animate={{ rotate: open ? 45 : 0, scale: open ? 0.8 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2L16 16M16 2L2 16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
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

          {!open && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: activeColor.bg }}
              animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.button>

        {/* User + store name badge — shown below trigger when open */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute bottom-0 left-14 whitespace-nowrap"
            >
              {/* User info */}
              <div className="px-2.5 py-1.5 rounded-xl text-[10px] font-medium bg-white dark:bg-neutral-800 shadow border border-gray-100 dark:border-neutral-700 mb-1.5">
                <span className="font-bold text-gray-800 dark:text-white">{user?.username}</span>
                <span className="ml-1.5 capitalize text-blue-500">({user?.role})</span>
              </div>

              {/* Store name — click pencil to edit */}
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 shadow border border-gray-100 dark:border-neutral-700 min-w-[140px]">
                {editingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={nameInputRef}
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === "Enter") saveEditName();
                        if (e.key === "Escape") cancelEditName();
                      }}
                      className="flex-1 min-w-0 text-[11px] font-semibold bg-transparent border-b border-blue-500 outline-none text-gray-800 dark:text-white w-28"
                      placeholder="Store name…"
                    />
                    <button
                      onClick={saveEditName}
                      disabled={savingName}
                      className="p-0.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                    >
                      <Check size={12}/>
                    </button>
                    <button
                      onClick={cancelEditName}
                      className="p-0.5 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditName}
                    className="group flex items-center gap-1.5 w-full text-left"
                    title="Click to rename your store"
                  >
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                      🧾 {storeName}
                    </span>
                    <Pencil size={10} className="shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition"/>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN CONTENT */}
      <main className={`flex-1 overflow-hidden ${!isPOS ? "overflow-y-auto p-6 pb-10" : ""}`}>
        {children}
      </main>
    </div>
  );
}