import api from "./axios";

export const createHoldSale = (data) =>
  api.post("/hold-sales", data).then(res => res.data);

export const getHoldSales = () =>
  api.get("/hold-sales").then(res => res.data);

export const getHoldSaleNames = () =>
  api.get("/hold-sales/names").then(res => res.data);

export const deleteHoldSale = (id) =>
  api.delete(`/hold-sales/${id}`);
