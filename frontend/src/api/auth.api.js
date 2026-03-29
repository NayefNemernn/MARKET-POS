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

// Human-readable device name from user agent
const getDeviceName = () => {
  const ua = navigator.userAgent;

  let os = "Unknown OS";
  if (/Windows NT 10/.test(ua))        os = "Windows 10/11";
  else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7";
  else if (/Windows/.test(ua))         os = "Windows";
  else if (/Mac OS X/.test(ua))        os = "macOS";
  else if (/Android/.test(ua))         os = "Android";
  else if (/iPhone|iPad/.test(ua))     os = "iOS";
  else if (/Linux/.test(ua))           os = "Linux";

  let browser = "Unknown Browser";
  if (/Edg\//.test(ua))                         browser = "Edge";
  else if (/OPR\/|Opera/.test(ua))              browser = "Opera";
  else if (/Chrome\//.test(ua))                 browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua))                browser = "Firefox";

  return `${browser} on ${os}`;
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
    deviceId: getDeviceId(),
    deviceName: getDeviceName()
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