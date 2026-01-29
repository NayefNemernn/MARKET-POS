import api from "./axios";

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};
