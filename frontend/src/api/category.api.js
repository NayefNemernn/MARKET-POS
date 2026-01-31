import api from "./axios";

// GET ALL CATEGORIES
export const getCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};

// CREATE CATEGORY
export const createCategory = async (name) => {
  const res = await api.post("/categories", { name });
  return res.data;
};

// DELETE CATEGORY
export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`);
};
