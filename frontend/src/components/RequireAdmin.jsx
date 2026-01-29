import React from "react";

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
