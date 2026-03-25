import { authApi } from "./axios";
import api from "./axios";

// Persistent device ID — generated once per browser
const getDeviceId = () => {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
};

// Fetch active users for login page (public)
export const getLoginUsers = async () => {
  const res = await authApi.get("/auth/users");
  return res.data;
};

export const login = async ({ username, password }) => {
  const res = await authApi.post("/auth/login", {
    username,
    password,
    deviceId: getDeviceId()
  });
  return res.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // still clear locally even if request fails
  }
};

export const changeUserPassword = async (userId, newPassword) => {
  const res = await api.post(`/users/${userId}/change-password`, { newPassword });
  return res.data;
};