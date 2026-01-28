import api from "./axios";

export const getProductByBarcode = async (barcode) => {
  const res = await api.get(`/products/barcode/${barcode}`);
  return res.data;
};

export const getAllProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};
