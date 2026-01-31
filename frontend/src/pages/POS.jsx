import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { getProductByBarcode } from "../api/product.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../context/AuthContext";
import Receipt from "./Receipt";
import useOfflineSales from "../hooks/useOfflineSales";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { saveOffline, sync } = useOfflineSales();
  const [status, setStatus] = useState(
    navigator.onLine ? "ONLINE" : "OFFLINE"
  );

  const { logout } = useAuth();
  const { cart, addToCart, clearCart, total } = useCart();

  const inputRef = useRef(null);

  /* ======================
     LOAD PRODUCTS + CATEGORIES
  ====================== */
  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);
      setProducts(p.data);
      setCategories(c.data);
    };
    load();
  }, []);

  /* ======================
     OFFLINE / ONLINE SYNC
  ====================== */
  useEffect(() => {
    const goOnline = async () => {
      setStatus("SYNCING");
      await sync();
      setStatus("ONLINE");
    };
    const goOffline = () => setStatus("OFFLINE");

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ======================
     KEYBOARD SHORTCUTS
  ====================== */
  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (lastSale) return;
      if (e.key === "F9") handleCheckout();
      if (e.key === "Escape") {
        clearCart();
        setBarcode("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, lastSale]);

  /* ======================
     BARCODE SCAN
  ====================== */
  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      addToCart(product);
      setBarcode("");
    } catch {
      setError("Product not found");
      setTimeout(() => setError(""), 1500);
    }
    inputRef.current?.focus();
  };

  /* ======================
     CHECKOUT
  ====================== */
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // ⚠️ zero-stock warning (allow)
    const zeroItem = cart.find(
      (i) => i.stock !== undefined && i.stock <= 0
    );
    if (zeroItem) {
      const ok = window.confirm(
        `"${zeroItem.name}" is out of stock.\n\nContinue anyway?`
      );
      if (!ok) return;
    }

    const payload = {
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      paymentMethod: "cash"
    };

    try {
      if (!navigator.onLine) {
        saveOffline(payload);
        setStatus("OFFLINE");
        setLastSale({
          ...payload,
          createdAt: new Date()
        });
      } else {
        const res = await createSale(payload);
        setLastSale(res.sale);
      }
      clearCart();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Checkout failed. Sale not completed."
      );
    }
  };

  /* ======================
     RECEIPT VIEW
  ====================== */
  if (lastSale) {
    return (
      <Receipt
        sale={lastSale}
        onClose={() => {
          setLastSale(null);
          inputRef.current?.focus();
        }}
      />
    );
  }

  /* ======================
     FILTER PRODUCTS
  ====================== */
  const filteredProducts = products.filter(
    (p) =>
      selectedCategory === "all" ||
      p.category === selectedCategory
  );

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧾 POS Terminal</h1>
        <div className="flex gap-3 items-center">
          <span
            className={`text-sm font-semibold ${
              status === "ONLINE"
                ? "text-green-600"
                : status === "SYNCING"
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {status}
          </span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* CATEGORIES */}
        <aside className="col-span-2 bg-white rounded shadow p-3">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full text-left px-3 py-2 rounded mb-1 ${
              selectedCategory === "all" &&
              "bg-blue-600 text-white"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c.name)}
              className={`w-full text-left px-3 py-2 rounded mb-1 ${
                selectedCategory === c.name &&
                "bg-blue-600 text-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </aside>

        {/* PRODUCTS */}
        <section className="col-span-6 bg-white rounded shadow p-4">
          <form onSubmit={handleScan} className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode"
              className="flex-1 border rounded px-3 py-2"
            />
            <button className="bg-blue-600 text-white px-4 rounded">
              Add
            </button>
          </form>

          {error && (
            <p className="text-red-600 text-sm mb-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                className={`border rounded-lg p-3 text-left hover:shadow ${
                  p.stock <= 0 && "opacity-50"
                }`}
              >
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-sm">${p.price}</p>
                {p.stock <= 0 && (
                  <p className="text-xs text-red-600">
                    Out of stock
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* CART */}
        <aside className="col-span-4 bg-white rounded shadow p-4">
          <h2 className="font-bold mb-3">Cart</h2>

          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between mb-2"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                {item.stock <= 0 && (
                  <span className="text-xs text-red-600">
                    Out of stock
                  </span>
                )}
              </div>
              <span>x{item.quantity}</span>
            </div>
          ))}

          {cart.length === 0 && (
            <p className="text-gray-400 text-sm">
              Cart is empty
            </p>
          )}

          <div className="border-t mt-4 pt-4 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-green-600">
              {total}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={status === "SYNCING"}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded text-lg disabled:opacity-50"
          >
            {status === "SYNCING"
              ? "Syncing…"
              : "Checkout (F9)"}
          </button>
        </aside>
      </div>
    </div>
  );
}
