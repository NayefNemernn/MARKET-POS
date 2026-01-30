import { authApi } from "./axios";

export const login = async ({ username, password }) => {
  const res = await authApi.post("/auth/login", {
    username,
    password,
  });
  return res.data;
};
