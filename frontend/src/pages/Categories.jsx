import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH CATEGORIES
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ADD CATEGORY
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return;

    try {
      await api.post("/categories", { name });
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Create failed");
    }
  };

  // DELETE CATEGORY
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) {
    return <p className="p-6">Loading categories...</p>;
  }

  return (
    <RequireAdmin>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>

        {/* ADD CATEGORY */}
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 p-3 border rounded"
          />
          <button className="bg-blue-600 text-white px-5 rounded">
            Add
          </button>
        </form>

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        {/* CATEGORY LIST */}
        <div className="bg-white shadow rounded overflow-hidden">
          {categories.length === 0 ? (
            <p className="p-4 text-gray-500">No categories yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id} className="border-t">
                    <td className="p-3 font-medium">
                      {cat.name}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
