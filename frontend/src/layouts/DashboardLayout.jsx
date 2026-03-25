import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../context/LanguageContext";
import {
  LayoutDashboard, ShoppingCart, Package, Tags,
  Users, BarChart3, Clock, Sun, Moon, LogOut, ChevronDown
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LABELS = {
  dashboard: "Dashboard", pos: "POS", products: "Products",
  categories: "Categories", users: "Users", reports: "Reports", paylater: "Pay Later"
};

export default function DashboardLayout({ children, page, setPage, user }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const { logout } = useAuth();

  const isAdmin = user?.role === "admin";
  const isPOS = page === "pos";

  const [navVisible, setNavVisible] = useState(false);
  const hideTimer = useRef(null);
  

  const menu = [
    { key: "dashboard", icon: LayoutDashboard, adminOnly: true  },
    { key: "pos",        icon: ShoppingCart,   adminOnly: false },
    { key: "products",   icon: Package,        adminOnly: false },
    { key: "categories", icon: Tags,           adminOnly: false },
    { key: "users",      icon: Users,          adminOnly: true  },
    { key: "reports",    icon: BarChart3,      adminOnly: false },
    { key: "paylater",   icon: Clock,          adminOnly: false },
  ];

  const showNav = () => {
    clearTimeout(hideTimer.current);
    setNavVisible(true);
  };

  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setNavVisible(false), 1800);
  };

  // Show on mouse near top (within 60px)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (e.clientY < 60) showNav();
      else if (navVisible && e.clientY > 140) scheduleHide();
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [navVisible]);

  // Show on touch swipe down from top
  useEffect(() => {
    let startY = null;
    const onTouchStart = (e) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (startY !== null && startY < 60 && e.touches[0].clientY - startY > 20) showNav();
    };
    const onTouchEnd = () => { startY = null; scheduleHide(); };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white overflow-hidden">

      {/* ── SLIDE-DOWN NAV ── */}
      {/* Invisible hover trigger zone at the very top */}
      <div
        className="fixed top-0 left-0 right-0 h-3 z-50"
        onMouseEnter={showNav}
      />

      <AnimatePresence>
        {navVisible && (
          <motion.div
            
            key="navbar"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onMouseEnter={() => { clearTimeout(hideTimer.current); }}
            onMouseLeave={scheduleHide}
            className="fixed top-0 left-0 right-0 z-50
              bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl
              border-b border-gray-200 dark:border-neutral-800
              shadow-[0_4px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between px-5 py-3 max-w-screen-xl mx-auto">

              {/* Logo + page label */}
              <div className="flex items-center gap-3">
                <span className="font-bold text-base dark:text-white">🧾 Market POS</span>
                <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full capitalize">
                  {NAV_LABELS[page] || page}
                </span>
              </div>

              {/* Nav items */}
              <div className="flex items-center gap-1">
                {menu.map(item => {
                  if (item.adminOnly && !isAdmin) return null;
                  const Icon = item.icon;
                  const active = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setPage(item.key); scheduleHide(); }}
                      title={NAV_LABELS[item.key]}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                        ${active
                          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      <Icon size={15} />
                      <span className="hidden sm:inline">{NAV_LABELS[item.key]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                <button onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-gray-600 dark:text-gray-400">
                  {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
                </button>
                <button onClick={toggleLang}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs font-bold transition">
                  {lang === "en" ? "AR" : "EN"}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 hidden md:block">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{user?.username}</span>
                  <span className="text-blue-500 ml-1 capitalize">({user?.role})</span>
                </div>
                <button onClick={() => logout()}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600
                    px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium">
                  <LogOut size={13}/> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent pull-tab indicator — always visible at top center */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-40 cursor-pointer"
        onClick={showNav}
        onTouchStart={showNav}
      >
        <motion.div
          animate={{ y: navVisible ? -40 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col items-center pt-1"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-neutral-700 mb-0.5" />
          <ChevronDown size={12} className="text-gray-400 dark:text-neutral-600" />
        </motion.div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 overflow-hidden ${!isPOS ? "overflow-y-auto p-6 pb-10" : ""}`}>
        {children}
      </main>
    </div>
  );
}