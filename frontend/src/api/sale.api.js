import api from "./axios";

export const createSale = async (data) => {
  const res = await api.post("/sales", data);
  return res.data;
};
