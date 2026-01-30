import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";


export default function Sidebar({ user, page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);

  const { dark, setDark } = useTheme();

  const Item = ({ id, label }) => (
  <button
    onClick={() => setPage(id)}
    title={collapsed ? label : ""}
    className={`flex items-center w-full px-4 py-3 rounded-lg transition
      ${page === id
        ? "bg-blue-600 text-white"
        : "hover:bg-gray-200 dark:hover:bg-gray-700"}
    `}
  >
    {!collapsed && label}
  </button>
);


  return (
    <div
      className={`h-screen bg-white border-r shadow-sm transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        {!collapsed && (
          <h1 className="font-bold text-lg">
            🧾 Market POS
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* MENU */}
      <div className="p-3 flex flex-col gap-2">
        {user.role === "admin" && (
          <>
            <Item
              icon={LayoutDashboard}
              label="Dashboard"
              target="dashboard"
            />
            <Item
              icon={Package}
              label="Products"
              target="products"
            />
            <Item
              icon={Tags}
              label="Categories"
              target="categories"
            />
            <Item
              icon={Users}
              label="Users"
              target="users"
            />
            <Item
              icon={BarChart3}
              label="Reports"
              target="reports"
            />
          </>
        )}

        <Item
          icon={ShoppingCart}
          label="POS"
          target="pos"
        />
      </div>

      {/* FOOTER */}
<div className="absolute bottom-4 w-full px-4">
  <button
    onClick={() => setDark(!dark)}
    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg
      bg-gray-100 dark:bg-gray-800
      text-gray-700 dark:text-gray-200
      hover:bg-gray-200 dark:hover:bg-gray-700
      transition-all"
  >
    {dark ? <Sun size={18} /> : <Moon size={18} />}
    {!collapsed && (
      <span>{dark ? "Light Mode" : "Dark Mode"}</span>
    )}
  </button>
</div>

    </div>
  );
}
