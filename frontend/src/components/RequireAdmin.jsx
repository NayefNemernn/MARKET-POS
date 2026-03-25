import React from "react";

// Only use this on pages that are TRULY admin-only (Users page)
// Reports, Categories, Dashboard are now accessible by all users
export default function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied — Admins only
      </div>
    );
  }

  return children;
}