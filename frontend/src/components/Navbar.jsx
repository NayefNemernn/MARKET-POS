import React from "react";

export default function Navbar({ user, page, setPage }) {
  const NavButton = ({ label, target }) => (
    <button
      onClick={() => setPage(target)}
      className={`px-4 py-2 rounded text-sm font-medium ${
        page === target
          ? "bg-blue-600 text-white"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
      {/* LOGO */}
      <div className="font-bold text-lg">
        🧾 Market POS
      </div>

      {/* NAV */}
      <div className="flex gap-2">
        {user.role === "admin" && (
          <>
            <NavButton label="Dashboard" target="dashboard" />
            <NavButton label="Products" target="products" />
            <NavButton label="Categories" target="categories" />
            <NavButton label="Users" target="users" />
            <NavButton label="Reports" target="reports" />
          </>
        )}

        <NavButton label="POS" target="pos" />
      </div>

      {/* USER */}
      <div className="text-sm text-gray-600">
        {user.username} ({user.role})
      </div>
    </div>
  );
}
