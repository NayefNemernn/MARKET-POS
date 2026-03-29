import React, { createContext, useContext, useState, useEffect } from "react";
import { logout as logoutApi } from "../api/auth.api";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user"))
  );

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await logoutApi();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Update the store name for this account
  const updateStoreName = async (name) => {
    const res = await api.patch("/users/me/store-name", { storeName: name });
    const updated = { ...user, storeName: res.data.storeName };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    return res.data.storeName;
  };

  // Derived helper — always has a fallback
  const storeName = user?.storeName || "Market POS";

  // Global 401 interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && localStorage.getItem("token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, storeName, updateStoreName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);