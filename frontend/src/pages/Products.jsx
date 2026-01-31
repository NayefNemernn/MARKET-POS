import React, { useEffect, useState } from "react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../api/product.api";
import { getCategories } from "../api/category.api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    category: ""
  });

  /* =======================
     LOAD DATA
  ======================= */
  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  /* =======================
     CREATE PRODUCT
  ======================= */
  const handleCreate = async (e) => {
    e.preventDefault();

    await createProduct({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    });

    setForm({
      name: "",
      barcode: "",
      price: "",
      stock: "",
      category: ""
    });

    loadProducts();
  };

  /* =======================
     UPDATE FIELD (🔥 FIX)
  ======================= */
  const updateField = async (id, field, value) => {
    await updateProduct(id, {
      [field]: Number(value)
    });

    // update UI immediately
    setProducts((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, [field]: value } : p
      )
    );
  };

  /* =======================
     DELETE
  ======================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📦 Product Management</h1>

      {/* ADD PRODUCT */}
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-6 gap-3 bg-white p-4 rounded shadow"
      >
        <input
          placeholder="Name"
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
          placeholder="Barcode"
          className="border p-2 rounded"
          value={form.barcode}
          onChange={(e) =>
            setForm({ ...form, barcode: e.target.value })
          }
          required
        />

        <input
          type="number"
          placeholder="Price"
          className="border p-2 rounded"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          required
        />

        <input
          type="number"
          placeholder="Stock"
          className="border p-2 rounded"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: e.target.value })
          }
          required
        />

        <select
          className="border p-2 rounded"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="bg-green-600 text-white rounded">
          Add Product
        </button>
      </form>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Barcode</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-center">{p.barcode}</td>
                <td className="p-3 text-center">
                  {p.category?.name || "-"}
                </td>

                <td className="p-3 text-center">
                  <input
                    type="number"
                    defaultValue={p.price}
                    onBlur={(e) =>
                      updateField(p._id, "price", e.target.value)
                    }
                    className="border p-1 w-20"
                  />
                </td>

                <td className="p-3 text-center">
                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={(e) =>
                      updateField(p._id, "stock", e.target.value)
                    }
                    className={`border p-1 w-20 ${
                      p.stock === 0 ? "border-red-500" : ""
                    }`}
                  />
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-400"
                >
                  No products
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
