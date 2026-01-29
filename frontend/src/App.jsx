import React from "react";
import POS from "./pages/POS";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <AuthProvider>
      {token ? <POS /> : <Login />}
    </AuthProvider>
  );
}
