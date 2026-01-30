import React, { useEffect, useState } from "react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../api/product.api";
import api from "../api/axios";

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

  // LOAD DATA
  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const loadCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // ADD PRODUCT
  const handleSubmit = async (e) => {
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

  // UPDATE INLINE
  const handleUpdate = async (id, field, value) => {
    await updateProduct(id, { [field]: value });
    loadProducts();
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Product Management
      </h1>

      {/* ADD PRODUCT */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-5 gap-3 mb-6"
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          placeholder="Barcode"
          value={form.barcode}
          onChange={(e) =>
            setForm({ ...form, barcode: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
          className="border p-2 rounded"
          required
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="col-span-5 bg-green-600 text-white py-2 rounded">
          Add Product
        </button>
      </form>

      {/* PRODUCTS TABLE */}
      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Name</th>
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
              <td className="p-3">{p.barcode}</td>
              <td className="p-3">
                {p.category?.name || "-"}
              </td>
              <td className="p-3">
                <input
                  type="number"
                  defaultValue={p.price}
                  onBlur={(e) =>
                    handleUpdate(
                      p._id,
                      "price",
                      Number(e.target.value)
                    )
                  }
                  className="border p-1 w-20"
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  defaultValue={p.stock}
                  onBlur={(e) =>
                    handleUpdate(
                      p._id,
                      "stock",
                      Number(e.target.value)
                    )
                  }
                  className="border p-1 w-20"
                />
              </td>
              <td className="p-3">
                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
