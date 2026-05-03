import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: BASE_URL });

export const getStoreInfo       = (slug)     => api.get(`/api/public/${slug}`).then(r => r.data);

// Customer auth
export const customerRegister   = (slug, data)          => api.post(`/api/public/${slug}/auth/register`, data).then(r => r.data);
export const customerLogin      = (slug, data)          => api.post(`/api/public/${slug}/auth/login`, data).then(r => r.data);
export const customerGetMe      = (slug, token)         => api.get(`/api/public/${slug}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
export const customerUpdateMe   = (slug, token, data)   => api.patch(`/api/public/${slug}/auth/me`, data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
export const getStoreProducts   = (slug)     => api.get(`/api/public/${slug}/products`).then(r => r.data);
export const submitOrder        = (data)     => api.post("/api/orders", data).then(r => r.data);
export const trackOrder         = (orderId)  => api.get(`/api/orders/track/${orderId}`).then(r => r.data);
export const getDeliveryOrder     = (orderId)                       => api.get(`/api/orders/delivery/${orderId}`).then(r => r.data);
export const confirmCashCollected = (orderId)                       => api.patch(`/api/orders/${orderId}/cash-collected`).then(r => r.data);
export const driverAcceptOrder    = (orderId, chatId, driverName)   => api.patch(`/api/orders/${orderId}/driver-accept`, { chatId, driverName }).then(r => r.data);
