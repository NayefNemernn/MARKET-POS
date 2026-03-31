import api from "./axios";

export const getPlatformStats  = ()           => api.get("/superadmin/stats").then(r => r.data);
export const getAllStores       = ()           => api.get("/superadmin/stores").then(r => r.data);
export const getStoreDetails   = (id)         => api.get(`/superadmin/stores/${id}`).then(r => r.data);
export const updateStorePlan   = (id, data)   => api.put(`/superadmin/stores/${id}/plan`, data).then(r => r.data);
export const toggleStoreActive = (id)         => api.put(`/superadmin/stores/${id}/toggle`).then(r => r.data);