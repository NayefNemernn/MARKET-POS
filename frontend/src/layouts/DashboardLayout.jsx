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
  ChevronLeft
} from "lucide-react";

export default function DashboardLayout({ children, page, setPage, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  // dark mode toggle
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const menu = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "pos", label: "POS", icon: ShoppingCart },
    { key: "products", label: "Products", icon: Package, admin: true },
    { key: "categories", label: "Categories", icon: Tags, admin: true },
    { key: "users", label: "Users", icon: Users, admin: true },
    { key: "reports", label: "Reports", icon: BarChart3, admin: true }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* SIDEBAR */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 flex flex-col`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <h1 className="text-lg font-bold">Market POS</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ChevronLeft
              className={`transition-transform ${
                collapsed ? "rotate-180" : ""
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
                onClick={() => setPage(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg
                transition-all
                ${
                  active
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
              localStorage.clear();
              window.location.reload();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
