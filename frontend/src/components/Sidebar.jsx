import {
  LayoutDashboard, ShoppingCart, Package, Tags,
  Users, BarChart3, ChevronLeft, ChevronRight,
  CreditCard, LogOut, Moon, Sun
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ user, page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);
  const { dark, setDark } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const Item = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setPage(id)}
      title={collapsed ? label : ""}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all
        ${page === id
          ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}
      `}
    >
      {Icon && <Icon size={18} className="flex-shrink-0" />}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );

  const isAdmin = user?.role === "admin";

  return (
    <div
      className={`h-screen flex flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-800
        shadow-sm transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-800">
        {!collapsed && (
          <h1 className="font-bold text-lg dark:text-white">🧾 Market POS</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* USER CHIP */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
          <p className="font-semibold text-sm dark:text-white">{user?.username}</p>
          <span className="text-xs text-blue-500 capitalize">{user?.role}</span>
        </div>
      )}

      {/* MENU */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto mt-2">

        {/* Admin-only pages */}
        {isAdmin && (
          <>
            <Item id="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <Item id="users" label="Users" icon={Users} />
          </>
        )}

        {/* Shared pages (all authenticated users) */}
        <Item id="pos" label="Point of Sale" icon={ShoppingCart} />
        <Item id="products" label="Products" icon={Package} />
        <Item id="categories" label="Categories" icon={Tags} />
        <Item id="reports" label="Reports" icon={BarChart3} />
        <Item id="paylater" label="Pay Later" icon={CreditCard} />
      </nav>

      {/* FOOTER */}
      <div className="p-3 flex flex-col gap-2 border-t dark:border-gray-800">
        <button
          onClick={() => setDark(!dark)}
          title={collapsed ? (dark ? "Light Mode" : "Dark Mode") : ""}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-200
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all text-sm"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl
            text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
            transition-all text-sm"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}