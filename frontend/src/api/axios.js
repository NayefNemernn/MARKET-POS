import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// 🔓 Public client (NO token)
export const authApi = axios.create({
<<<<<<< HEAD
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
=======
  baseURL: BASE_URL
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
});

// 🔐 Protected client (WITH token)
const api = axios.create({
<<<<<<< HEAD
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
=======
  baseURL: BASE_URL
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
});

// Attach JWT token ONLY to protected requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;