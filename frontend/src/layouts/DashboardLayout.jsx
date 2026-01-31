import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  Clock,
  Menu
} from "lucide-react";

export default function DashboardLayout({ children, page, setPage, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPOS = page === "pos";

  // 🌙 Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ⛶ Exit fullscreen on ESC
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const menu = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "pos", label: "POS", icon: ShoppingCart },
    { key: "products", label: "Products", icon: Package, admin: true },
    { key: "categories", label: "Categories", icon: Tags, admin: true },
    { key: "users", label: "Users", icon: Users, admin: true },
    { key: "reports", label: "Reports", icon: BarChart3, admin: true },
    { key: "paylater", label: "Pay Later", icon: Clock, admin: true },
  ];

  const SidebarContent = () => (
    <>
      {/* LOGO */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && <h1 className="text-lg font-bold">Market POS</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ChevronLeft
            className={`transition-transform ${collapsed ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 space-y-1">
        {menu.map((item) => {
          if (item.admin && user.role !== "admin") return null;
          const Icon = item.icon;
          const active = page === item.key;

          return (
            <button
              key={item.key}
              onClick={() => {
                setPage(item.key);
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition
                ${active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t dark:border-gray-700 space-y-2">
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>Theme</span>}
        </button>

        <button
          onClick={() => {
            // Clear all auth & app state
            localStorage.clear();
            sessionStorage.clear();

            // 🔥 FORCE full reload + prevent back navigation
            window.location.replace("/");
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded
             text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>

      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      {/* MOBILE TOP BAR */}
      {!isPOS && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b">
          <button onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>
          <span className="font-bold">Market POS</span>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      {!isPOS && (
        <aside
          className={`fixed z-50 top-0 left-0 h-full w-64 bg-white dark:bg-gray-800
          transform transition-transform duration-300 md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent />
        </aside>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isPOS && (
        <aside
          className={`hidden md:flex ${collapsed ? "w-20" : "w-64"
            } transition-all duration-300 bg-white dark:bg-gray-800 border-r`}
        >
          <div className="flex flex-col w-full">
            <SidebarContent />
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main
        className={`flex-1 overflow-y-auto p-6 ${!isPOS ? "md:ml-0 mt-12 md:mt-0" : ""
          }`}
      >
        {children}
      </main>
    </div>
  );
}
