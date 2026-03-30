import React, { useEffect, useState, useRef } from "react";
import { useRefresh } from "../context/RefreshContext";
import { Search, Barcode, Printer, ScanLine, X, Plus, Package, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsExcel,
} from "../api/product.api";

import { getCategories, createCategory } from "../api/category.api";

import toast from "react-hot-toast";
import JsBarcode from "jsbarcode";

import ProductCard from "../components/products/ProductCard";
import ProductEditPanel from "../components/products/ProductEditPanel";
import ProductForm from "../components/products/ProductForm";
import ImageDropzone from "../components/products/ImageDropzone";
import ExchangeRateBar from "../components/ExchangeRateBar";
import VoiceButton from "../components/common/VoiceButton";
import { useProductsTranslation } from "../hooks/useProductsTranslation";

export default function Products() {
  const t = useProductsTranslation();
  const { tick, refresh } = useRefresh();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [inventoryMode, setInventoryMode] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({ name: "", price: "", cost: "", stock: "", category: "" });

  // ── IMPORT STATE
  const [showImport, setShowImport]       = useState(false);
  const [importFile, setImportFile]       = useState(null);
  const [importing, setImporting]         = useState(false);
  const [importResult, setImportResult]   = useState(null);
  const importInputRef                    = useRef(null);

  const previewBarcodeRef = useRef(null);

  /* LOAD */
  const load = async () => {
    try {
      const [p, c] = await Promise.all([getAllProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => { load(); }, [tick]);

  /* SEARCH */
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  const lowStock = products.filter(p => p.stock <= 3);

  /* GENERATE BARCODE */
  const generateBarcode = () => {
    const code = Date.now().toString();
    setBarcode(code);
    // SVG rendering happens in the useEffect below, after React re-renders with the new code
  };

  // Re-render the preview SVG whenever barcode changes
  useEffect(() => {
    if (barcode && previewBarcodeRef.current) {
      JsBarcode(previewBarcodeRef.current, barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        margin: 8,
      });
    }
  }, [barcode]);

  /* CREATE */
  const handleCreate = async () => {
    if (!form.name || !barcode) { toast.error(t.nameRequired); return; }

    let categoryId = null;
    if (form.category) {
      const existing = categories.find(c => c.name.toLowerCase() === form.category.toLowerCase());
      if (existing) {
        categoryId = existing._id;
      } else {
        const newCat = await createCategory({ name: form.category });
        categoryId = newCat._id;
      }
    }

    const data = new FormData();
    data.append("name",     form.name);
    data.append("barcode",  barcode);
    data.append("price",    form.price  || 0);
    data.append("cost",     form.cost   || 0);
    data.append("stock",    form.stock  || 0);
    data.append("category", categoryId || "");
    if (form.expiryDate) data.append("expiryDate", form.expiryDate);
    if (image) data.append("image", image);

    try {
      await createProduct(data);
      toast.success(t.productCreated);
      setForm({ name: "", price: "", cost: "", stock: "", category: "", expiryDate: "" });
      setBarcode("");
      setPreview("");
      setImage(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create product");
    }
  };

  /* DELETE */
  const remove = async (id) => {
    if (!window.confirm(t.deleteProduct)) return;
    await deleteProduct(id);
    toast.success(t.deleted);
    refresh();
  };

  /* IMPORT EXCEL */
  const handleImport = async () => {
    if (!importFile) { toast.error("Please select an Excel file"); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importProductsExcel(importFile);
      setImportResult(result);
      toast.success(result.message);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  /* EXPORT EXCEL */
  const handleExport = () => {
    if (products.length === 0) { toast.error("No products to export"); return; }

    const headers = ["Barcode", "Product Name", "Price (USD)", "Cost (USD)", "Stock", "Category", "Expiry Date", "Image URL"];
    const rows = products.map(p => [
      p.barcode,
      p.name,
      p.price,
      p.cost,
      p.stock,
      p.category?.name || "",
      p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : "",
      p.image || "",
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `products_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${products.length} products`);
  };

  const printLabel = () => {
    if (!barcode) { toast.error("Generate a barcode first"); return; }

    // 1. Render barcode into a fresh off-screen SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    JsBarcode(svg, barcode, {
      format: "CODE128",
      width: 3,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    });

    // 2. Serialize SVG → data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    document.body.removeChild(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl  = URL.createObjectURL(svgBlob);

    // 3. Draw SVG onto a canvas → PNG
    const img = new Image();
    img.onload = () => {
      const canvas  = document.createElement("canvas");
      const scale   = 3; // high-res for crisp printing
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);

      // 4. Open PNG in new tab and trigger print
      const pngUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode Label — ${barcode}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; }
              @media print {
                @page { margin: 10mm; }
                body { min-height: unset; }
              }
            </style>
          </head>
          <body>
            <img src="${pngUrl}" />
            <script>
              window.onload = () => { window.print(); };
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    };
    img.src = svgUrl;
  };

  /* INVENTORY SCAN — scan barcode to +1 stock */
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;

    const handleScanner = async (e) => {
      if (!inventoryMode) return;
      if (e.target.tagName === "INPUT") return;

      const now = Date.now();
      if (now - lastKeyTime > 150) buffer = "";
      lastKeyTime = now;

      if (e.key === "Enter") {
        const code = buffer.trim();
        buffer = "";

        const product = products.find(p => p.barcode === code);
        if (!product) { toast.error(`Barcode not found: ${code}`); return; }

        try {
          const updated = await updateProduct(product._id, { stock: product.stock + 1 });
          setProducts(prev => prev.map(p => p._id === updated._id ? updated : p));
          toast.success(`✅ ${product.name} → stock +1 (now ${product.stock + 1})`);
        } catch {
          toast.error("Failed to update stock");
        }
        return;
      }

      if (/^[0-9a-zA-Z\-]$/.test(e.key)) buffer += e.key;
    };

    window.addEventListener("keydown", handleScanner);
    return () => window.removeEventListener("keydown", handleScanner);
  }, [inventoryMode, products]);

  return (
    <div className={`h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-neutral-950 transition-all duration-300 ${editingProduct ? "pr-[400px]" : ""}`}>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* Exchange rate */}
          <ExchangeRateBar />

          {/* ── TOP TOOLBAR ── */}
          <div className="flex flex-wrap items-center gap-3
            p-3 rounded-2xl bg-white dark:bg-[#141414]
            shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
            dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]">

            {/* Search */}
            <div className="relative flex-1 min-w-48 flex items-center gap-2">
              <Search size={16} className="absolute left-3 text-gray-400" />
              <input
                placeholder={t.searchProduct || "Search products..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none
                  bg-gray-50 dark:bg-[#0f0f0f]
                  border border-gray-200 dark:border-white/5
                  focus:border-blue-400 dark:focus:border-blue-500/50 transition"
              />
              <VoiceButton onResult={text => setSearch(text)} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={generateBarcode}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm
                  bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525]
                  text-gray-700 dark:text-gray-300 transition">
                <Barcode size={14}/> {t.generateBarcode || "Generate Barcode"}
              </button>

              <button onClick={printLabel}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm
                  bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525]
                  text-gray-700 dark:text-gray-300 transition">
                <Printer size={14}/> {t.printLabel || "Print Label"}
              </button>

              {/* Inventory scan toggle */}
              <button
                onClick={() => setInventoryMode(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${inventoryMode
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  }`}
              >
                <ScanLine size={14}/>
                {inventoryMode ? "Stop Scan" : "Inventory Scan"}
              </button>

              {/* Export */}
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525]
                  text-gray-700 dark:text-gray-300 transition">
                <Download size={14}/> Export
              </button>

              {/* Import */}
              <button
                onClick={() => { setShowImport(true); setImportFile(null); setImportResult(null); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium
                  bg-green-600 hover:bg-green-700 text-white
                  shadow-[0_0_12px_rgba(34,197,94,0.3)] transition">
                <Upload size={14}/> Import Excel
              </button>
            </div>
          </div>

          {/* Inventory scan active banner */}
          {inventoryMode && (
            <div className="flex items-center justify-between
              px-4 py-3 rounded-2xl
              bg-blue-50 dark:bg-blue-900/20
              border border-blue-200 dark:border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Inventory Scan Active — Scan barcodes to increase stock by 1
                </span>
              </div>
              <button onClick={() => setInventoryMode(false)}
                className="text-blue-400 hover:text-blue-600 transition">
                <X size={16}/>
              </button>
            </div>
          )}

          {/* ── STATS ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t.totalProducts || "Total Products", value: products.length,  color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: t.lowStock      || "Low Stock",      value: lowStock.length,   color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20" },
              { label: t.categories    || "Categories",     value: categories.length, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 border border-white/50 dark:border-white/5`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── ADD PRODUCT FORM ── */}
          <div className="rounded-2xl bg-white dark:bg-[#141414]
            shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
            dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]
            overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
              <Plus size={16} className="text-blue-500" />
              <span className="font-semibold text-sm">Add New Product</span>
            </div>
            <div className="p-5">
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
            </div>
          </div>

          {/* Barcode preview */}
          {barcode && (
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-4 shadow flex items-center gap-4">
              <svg ref={previewBarcodeRef} />
              <span className="text-xs text-gray-500 font-mono">{barcode}</span>
            </div>
          )}

          {/* ── PRODUCTS GRID ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={40} className="opacity-20 mb-3" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filtered.map(p => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onDelete={remove}
                    onEdit={product => setEditingProduct(product)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit panel */}
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

      {/* ── IMPORT MODAL ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileSpreadsheet size={18} className="text-green-600 dark:text-green-400"/>
                </div>
                <div>
                  <h2 className="font-bold text-sm">Import Products from Excel</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Add hundreds of products at once</p>
                </div>
              </div>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20}/>
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Step 1 — Download template */}
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Step 1 — Download template</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mb-3">Fill in your products then upload it below</p>
                <a
                  href="/products_import_template.xlsx"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  <Download size={13}/> Download Template (.xlsx)
                </a>
              </div>

              {/* Step 2 — Upload file */}
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Step 2 — Upload your filled file</p>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { setImportFile(e.target.files[0]); setImportResult(null); }}
                />
                <div
                  onClick={() => importInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed rounded-2xl p-6
                    flex flex-col items-center gap-2 text-center transition
                    border-gray-200 dark:border-white/10
                    hover:border-green-400 dark:hover:border-green-500/50"
                >
                  {importFile ? (
                    <>
                      <FileSpreadsheet size={28} className="text-green-500"/>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{importFile.name}</p>
                      <p className="text-xs text-gray-400">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-gray-300 dark:text-gray-600"/>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Click to select your Excel or CSV file</p>
                      <p className="text-xs text-gray-400">.xlsx · .xls · .csv</p>
                    </>
                  )}
                </div>
              </div>

              {/* Result */}
              {importResult && (
                <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={15} className="text-green-500"/>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">Import Complete</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Added",   value: importResult.inserted, color: "text-green-600 dark:text-green-400" },
                      { label: "Skipped", value: importResult.skipped,  color: "text-amber-600 dark:text-amber-400" },
                      { label: "Errors",  value: importResult.errors?.length || 0, color: "text-red-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white dark:bg-white/5 rounded-xl p-2 text-center">
                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  {importResult.errors?.slice(0,3).map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                      <AlertCircle size={11}/> Row {e.row}: {e.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium
                    bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525]
                    text-gray-700 dark:text-gray-300 transition"
                >
                  {importResult ? "Close" : "Cancel"}
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                    bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed
                    text-white transition"
                >
                  {importing
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Importing...</>
                    : <><Upload size={14}/> Import Now</>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}