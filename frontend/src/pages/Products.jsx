import React, { useEffect, useState, useRef } from "react";
import InventoryScanner from "../components/products/InventoryScanner";
import { Search, Barcode, Printer, Scan } from "lucide-react";

import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../api/product.api";

import { getCategories, createCategory } from "../api/category.api";

import toast from "react-hot-toast";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";

import ProductCard from "../components/products/ProductCard";
import ProductEditPanel from "../components/products/ProductEditPanel";
import ProductForm from "../components/products/ProductForm";
import ImageDropzone from "../components/products/ImageDropzone";

import { useProductsTranslation } from "../hooks/useProductsTranslation";

export default function Products() {

  const t = useProductsTranslation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [inventoryMode, setInventoryMode] = useState(false);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: ""
  });

  const previewBarcodeRef = useRef(null);
  const printBarcodeRef = useRef(null);
  const labelRef = useRef(null);

  /* LOAD DATA */

  const load = async () => {
    const p = await getAllProducts();
    const c = await getCategories();
    setProducts(p);
    setCategories(c);
  };

  useEffect(() => {
    load();
  }, []);

  /* SEARCH */

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  /* LOW STOCK */

  const lowStock = products.filter(p => p.stock <= 3);

  /* GENERATE BARCODE */

  const generateBarcode = () => {

    const code = Date.now().toString();
    setBarcode(code);

    setTimeout(() => {

      if (previewBarcodeRef.current) {
        JsBarcode(previewBarcodeRef.current, code, {
          format: "CODE128",
          width: 2,
          height: 40
        });
      }

      if (printBarcodeRef.current) {
        JsBarcode(printBarcodeRef.current, code, {
          format: "CODE128",
          width: 2,
          height: 40
        });
      }

    }, 100);
  };

  /* CREATE PRODUCT */

  const handleCreate = async () => {

    if (!form.name || !barcode) {
      toast.error(t.nameRequired);
      return;
    }

    let categoryId = null;

    if (form.category) {

      const existing = categories.find(
        c => c.name.toLowerCase() === form.category.toLowerCase()
      );

      if (existing) {
        categoryId = existing._id;
      } else {
        const newCategory = await createCategory({
          name: form.category
        });
        categoryId = newCategory._id;
      }

    }

    const data = new FormData();

    data.append("name", form.name);
    data.append("barcode", barcode);
    data.append("price", form.price || 0);
    data.append("stock", form.stock || 0);
    data.append("category", categoryId);

    if (image) data.append("image", image);

    await createProduct(data);

    toast.success(t.productCreated);

    setForm({
      name: "",
      price: "",
      stock: "",
      category: ""
    });

    setBarcode("");
    setPreview("");
    setImage(null);

    load();
  };

  /* DELETE */

  const remove = async (id) => {

    if (!window.confirm(t.deleteProduct)) return;

    await deleteProduct(id);

    toast.success(t.deleted);

    load();
  };

  /* PRINT */

  const handlePrint = useReactToPrint({
    content: () => labelRef.current
  });

  return (

    <div className="p-6 space-y-8 bg-gray-50 dark:bg-neutral-950 min-h-screen">

     {/* TOP BAR */}

<div
  className="
  flex items-center gap-3
  p-4 rounded-2xl

  bg-white dark:bg-[#141414]

  shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
  dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

  {/* SEARCH */}

  <div className="relative flex-1">

    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      placeholder={t.searchProduct}
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      className="
      w-full pl-10 pr-4 py-3 rounded-xl outline-none

      bg-gray-100 dark:bg-[#0f0f0f]

      shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
      dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
      "
    />

  </div>


  {/* GENERATE BARCODE */}

  <button
    onClick={generateBarcode}
    className="
    flex items-center gap-2

    px-4 py-2 rounded-full

    bg-gray-200 dark:bg-[#1c1c1c]

    text-gray-700 dark:text-gray-200

    hover:scale-[1.03]
    transition
    "
  >

    <Barcode size={16} />

    {t.generateBarcode}

  </button>


  {/* PRINT LABEL */}

  <button
    onClick={handlePrint}
    className="
    flex items-center gap-2

    px-4 py-2 rounded-full

    bg-gray-200 dark:bg-[#1c1c1c]

    text-gray-700 dark:text-gray-200

    hover:scale-[1.03]
    transition
    "
  >

    <Printer size={16} />

    {t.printLabel}

  </button>


  {/* INVENTORY SCAN */}

  <button
    onClick={()=>setInventoryMode(!inventoryMode)}
    className="
    flex items-center gap-2

    px-4 py-2 rounded-full

    bg-blue-600 hover:bg-blue-700

    text-white

    transition
    "
  >

    <Scan size={16} />

    {inventoryMode ? "Stop Scan" : "Inventory Scan"}

  </button>

</div>

      {/* DASHBOARD */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* TOTAL PRODUCTS */}

        <div
          className="
    p-6 rounded-2xl
    bg-white dark:bg-[#141414]

    shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
    dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
    "
        >

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.totalProducts}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {products.length}
          </h2>

        </div>


        {/* LOW STOCK */}

        <div
          className="
    p-6 rounded-2xl
    bg-white dark:bg-[#141414]

    shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
    dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
    "
        >

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.lowStock}
          </p>

          <h2 className="text-3xl font-bold mt-2 text-red-500">
            {lowStock.length}
          </h2>

        </div>


        {/* CATEGORIES */}

        <div
          className="
    p-6 rounded-2xl
    bg-white dark:bg-[#141414]

    shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
    dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
    "
        >

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.categories}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {categories.length}
          </h2>

        </div>

      </div>

      {/* PRODUCT FORM */}

      <ProductForm
        form={form}
        setForm={setForm}
        barcode={barcode}
        setBarcode={setBarcode}
        categories={categories}
        onCreate={handleCreate}

        preview={preview}
        setPreview={setPreview}
        setImage={setImage}

        ImageDropzone={ImageDropzone}
      />

      {/* IMAGE DROP

      <ImageDropzone
        preview={preview}
        setPreview={setPreview}
        setImage={setImage}
      /> */}

      {/* BARCODE PREVIEW */}

      <div className="bg-white rounded-2xl shadow p-4">
        <svg ref={previewBarcodeRef}></svg>
      </div>

      {/* PRODUCT GRID */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-4">

        {filtered.map(p => (

          <ProductCard
            key={p._id}
            product={p}
            onDelete={remove}
            onEdit={(product) => setEditingProduct(product)}
          />

        ))}

      </div>

      {/* EDIT PANEL */}

      <ProductEditPanel
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        setProducts={setProducts}
        updateProduct={updateProduct}
        editImage={image}
        setEditImage={setImage}
        editPreview={preview}
        setEditPreview={setPreview}
      />

      {/* PRINT LABEL */}

      <div style={{ position: "absolute", left: "-9999px" }}>

        <div ref={labelRef} className="p-6 text-center">

          <svg ref={printBarcodeRef}></svg>

          <p className="mt-2 font-semibold">{barcode}</p>

        </div>

      </div>

    </div>

  );

}