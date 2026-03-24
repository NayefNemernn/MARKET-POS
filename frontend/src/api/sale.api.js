import api from "./axios";
import useOfflineSales from "../hooks/useOfflineSales";

export const createSale = async (data) => {
  const res = await api.post("/sales", data);
  return res.data;
};

// Use this in CheckoutModal instead of createSale directly
export const createSaleWithOfflineFallback = async (data) => {
  if (navigator.onLine) {
    const res = await api.post("/sales", data);
    return { ...res.data, wasOffline: false };
  } else {
    // Save locally
    const { saveOffline } = useOfflineSales();
    await saveOffline(data);
    return { wasOffline: true, message: "Saved offline, will sync when connected" };
  }
};