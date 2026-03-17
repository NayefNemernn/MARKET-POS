import React from "react";
import { useLang } from "../context/LanguageContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  BarChart3,
  Clock,
  Sun,
  Moon
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

export default function DashboardLayout({ children, page, setPage, user }) {

  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();

  const menu = [
    { key: "dashboard", icon: LayoutDashboard },
    { key: "pos", icon: ShoppingCart },
    { key: "products", icon: Package, admin: true },
    { key: "categories", icon: Tags, admin: true },
    { key: "users", icon: Users, admin: true },
    { key: "reports", icon: BarChart3, admin: true },
    { key: "paylater", icon: Clock, admin: true }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 text-gray-900 dark:text-white">

      {/* TOP HEADER */}

      <header className="
        sticky top-0 z-40
        backdrop-blur-xl
        bg-white/80 dark:bg-neutral-900/80
        border-b border-gray-200 dark:border-neutral-800
      ">

        <div className="flex items-center justify-between px-6 py-4">

          <h1 className="font-bold text-lg">
            Market POS
          </h1>

          <div className="flex items-center gap-3">

            {/* THEME */}

            <button
              onClick={toggleTheme}
              className="
                p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-neutral-800
              "
            >
              {theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button
  onClick={toggleLang}
  className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
>
  {lang === "en" ? "AR" : "EN"}
</button>
            

            {/* USER */}

            <div className="text-sm text-gray-600 dark:text-gray-300">
              {user?.name}
            </div>

          </div>
          

        </div>

      </header>


      {/* MAIN CONTENT */}

      <main className="p-6 pb-28">
        {children}
      </main>


      {/* FLOATING NAVIGATION */}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">

        <div className="
          flex gap-3 px-4 py-3
          bg-white/80 dark:bg-neutral-900/80
          backdrop-blur-xl
          border border-gray-200 dark:border-neutral-700
          shadow-[0_10px_40px_rgba(0,0,0,0.15)]
          rounded-2xl
        ">

          {menu.map(item => {

            if (item.admin && user.role !== "admin") return null;

            const Icon = item.icon;
            const active = page === item.key;

            return (

              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`
                  p-3 rounded-xl
                  transition-all duration-200

                  ${active
                    ? "bg-blue-600 text-white shadow-md scale-110"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"}
                `}
              >

                <Icon size={20} />

              </button>

            );

          })}

        </div>

      </div>

    </div>
  );
}