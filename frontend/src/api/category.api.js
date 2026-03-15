import api from "./axios";

// GET ALL CATEGORIES
export const getCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};

// CREATE CATEGORY
<<<<<<< HEAD
export const createCategory = async (name) => {
  const res = await api.post("/categories", { name });
=======
export const createCategory = async (data) => {
  const res = await api.post("/categories", data);
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
  return res.data;
};

// DELETE CATEGORY
export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`);
<<<<<<< HEAD
};
=======
};
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
