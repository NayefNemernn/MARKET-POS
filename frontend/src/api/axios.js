import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// 🔓 Public client (NO token) — used for login, get users
export const authApi = axios.create({
  baseURL: BASE_URL
});

// 🔐 Protected client (WITH token)
const api = axios.create({
  baseURL: BASE_URL
});

// Attach JWT token to every protected request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;