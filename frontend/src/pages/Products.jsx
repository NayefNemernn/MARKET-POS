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

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    category: ""
  });

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


  /* ======================
     IMAGE UPLOAD
  ====================== */

  const handleImage = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));

  };


  /* ======================
     CREATE PRODUCT
  ====================== */

  const handleCreate = async (e) => {

    e.preventDefault();

    const data = new FormData();

    data.append("name", form.name);
    data.append("barcode", form.barcode);
    data.append("price", form.price);
    data.append("stock", form.stock);
    data.append("category", form.category);

    if (image) data.append("image", image);

    await createProduct(data);

    setForm({
      name: "",
      barcode: "",
      price: "",
      stock: "",
      category: ""
    });

    setPreview("");
    setImage(null);

    loadProducts();

  };


  /* ======================
     UPDATE FIELD
  ====================== */

  const updateField = async (id, field, value) => {

    await updateProduct(id, {
      [field]: Number(value)
    });

    setProducts(prev =>
      prev.map(p =>
        p._id === id ? { ...p, [field]: value } : p
      )
    );

  };


  /* ======================
     DELETE
  ====================== */

  const handleDelete = async (id) => {

    if (!window.confirm("Delete product?")) return;

    await deleteProduct(id);

    loadProducts();

  };


  return (

    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <h1 className="text-3xl font-bold">
        📦 Product Management
      </h1>


      {/* ADD PRODUCT */}

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-6 grid grid-cols-7 gap-4"
      >

        <input
          placeholder="Name"
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Barcode"
          className="border p-2 rounded"
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
        />

        <input
          type="number"
          placeholder="Price"
          className="border p-2 rounded"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input
          type="number"
          placeholder="Stock"
          className="border p-2 rounded"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />


        <select
          className="border p-2 rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >

          <option value="">Category</option>

          {categories.map(c => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}

        </select>


        {/* IMAGE UPLOAD */}

        <label className="border p-2 rounded flex items-center justify-center cursor-pointer">

          Upload Image

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />

        </label>


        <button className="bg-green-600 text-white rounded">
          Add
        </button>


        {/* PREVIEW */}

        {preview && (

          <img
            src={preview}
            className="w-16 h-16 object-cover rounded"
          />

        )}

      </form>



      {/* PRODUCTS GRID */}

      <div className="grid grid-cols-4 gap-6">

        {products.map(p => (

          <div
            key={p._id}
            className="bg-white rounded-xl shadow p-4 space-y-3"
          >

            <img
              src={
                p.image
                  ? `${import.meta.env.VITE_SERVER_URL}${p.image}`
                  : "/placeholder.png"
              }
              className="w-full h-32 object-cover rounded"
            />

            <h3 className="font-semibold">
              {p.name}
            </h3>

            <p className="text-sm text-gray-500">
              Barcode: {p.barcode}
            </p>


            <p className="text-sm">
              Category: {p.category?.name || "-"}
            </p>


            <div className="flex justify-between items-center">

              <div>

                <p className="text-xs text-gray-500">
                  Price
                </p>

                <input
                  type="number"
                  defaultValue={p.price}
                  onBlur={(e) => updateField(p._id, "price", e.target.value)}
                  className="border p-1 w-20"
                />

              </div>


              <div>

                <p className="text-xs text-gray-500">
                  Stock
                </p>

                <input
                  type="number"
                  defaultValue={p.stock}
                  onBlur={(e) => updateField(p._id, "stock", e.target.value)}
                  className={`border p-1 w-20 ${p.stock === 0 ? "border-red-500" : ""
                    }`}
                />

              </div>

            </div>


            <button
              onClick={() => handleDelete(p._id)}
              className="text-red-500 text-sm"
            >

              Delete

            </button>

          </div>

        ))}

      </div>

    </div>

  );

}