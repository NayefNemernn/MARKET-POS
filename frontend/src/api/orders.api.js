import api from "./axios";

export const getOrders         = (params = {}) => api.get("/orders", { params }).then(r => r.data);
export const getOrderById      = (id)           => api.get(`/orders/${id}`).then(r => r.data);
export const getPendingSales   = ()             => api.get("/orders/pending-sales").then(r => r.data);
export const acceptOrder       = (id)           => api.patch(`/orders/${id}/accept`).then(r => r.data);
export const rejectOrder       = (id, reason)   => api.patch(`/orders/${id}/reject`, { reason }).then(r => r.data);
export const markOutForDelivery = (id) => api.patch(`/orders/${id}/out-for-delivery`).then(r => r.data);
export const confirmPayment     = (id) => api.patch(`/orders/${id}/payment-received`).then(r => r.data);
export const updateOnlineStore = (data)         => api.patch("/store/online-settings", data).then(r => r.data);
