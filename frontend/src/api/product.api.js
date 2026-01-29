import api from "./axios";

/* =======================
   CASHIER / POS
======================= */

export const getProductByBarcode = async (barcode) => {
  const res = await api.get(`/products/barcode/${barcode}`);
  return res.data;
};

export const getAllProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};

/* =======================
   ADMIN
======================= */

export const createProduct = async (data) => {
  const res = await api.post("/products", data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};
