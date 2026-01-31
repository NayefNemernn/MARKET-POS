import React, { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";
import useOfflineSales from "../hooks/useOfflineSales";
import Receipt from "./Receipt";
import { createHoldSale } from "../api/holdSale.api";
import { getHoldSaleNames } from "../api/holdSale.api";

export default function POS({ setPage, user }) {
  /* =====================
     STATE
  ===================== */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { cart, addToCart, clearCart, increase, decrease, total } = useCart();
  const { saveOffline, sync } = useOfflineSales();

  const [status, setStatus] = useState(
    navigator.onLine ? "ONLINE" : "OFFLINE"
  );
const filteredNames = nameSuggestions.filter(n =>
  n.toLowerCase().includes(customerName.toLowerCase())
);

  const inputRef = useRef(null);

  /* =====================
     LOAD DATA
  ===================== */
  useEffect(() => {
    getAllProducts().then(setProducts);
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
  getHoldSaleNames().then(setNameSuggestions);
}, []);
  /* =====================
     ONLINE / OFFLINE
  ===================== */
  useEffect(() => {
    const online = async () => {
      setStatus("SYNCING");
      await sync();
      setStatus("ONLINE");
    };
    const offline = () => setStatus("OFFLINE");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [sync]);

  /* =====================
     AUTO FOCUS
  ===================== */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* =====================
     KEYBOARD SHORTCUTS
  ===================== */
  useEffect(() => {
    const handleKey = (e) => {
      if (lastSale) return;

      if (e.key === "F9") handleCheckout();
      if (e.key === "Escape") {
        clearCart();
        setBarcode("");
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cart, lastSale]);

  /* =====================
     FILTER PRODUCTS (FIXED)
  ===================== */
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
        (p) =>
          p.category &&
          p.category._id === selectedCategory
      );




  /* =====================
     BARCODE SCAN
  ===================== */
  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode) return;

    const product = products.find(
      (p) => p.barcode === barcode
    );

    if (!product) {
      setError("Product not found");
      setTimeout(() => setError(""), 1500);
      return;
    }

    if (product.stock === 0) {
      alert(`⚠️ ${product.name} is out of stock`);
    }

    addToCart(product);
    setBarcode("");
    inputRef.current?.focus();
  };

  const outOfStockItems = cart.filter(
    (item) => item.stock === 0
  );

  /* =====================
     CHECKOUT
  ===================== */
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // 🚫 FRONTEND BLOCK (UX)
    const outOfStockItems = cart.filter(
      (item) => item.stock < item.quantity
    );

    if (outOfStockItems.length > 0) {
      alert(
        "Cannot checkout.\nOut of stock:\n" +
        outOfStockItems.map(i => `• ${i.name}`).join("\n")
      );
      return;
    }

    const payload = {
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity
      })),
      paymentMethod: "cash"
    };

    try {
      const res = await createSale(payload);
      setLastSale(res.sale);
      clearCart();
    } catch (err) {
      // 🧠 IMPORTANT: check error type
      if (err.response?.status === 400) {
        alert(err.response.data.message || "Invalid sale");
        return;
      }

      // 🌐 ONLY offline / network errors go here
      if (!navigator.onLine) {
        saveOffline(payload);
        setStatus("OFFLINE");
        clearCart();
      }
    }
  };


  /* =====================
    Pay Later
 ===================== */
  const handlePayLater = async () => {
  if (!customerName.trim()) {
    alert("Enter customer name");
    return;
  }

  const payload = {
    customerName,
    items: cart.map(i => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity
    })),
    total
  };

  await createHoldSale(payload);

  clearCart();
  setCustomerName("");
  setShowSuggestions(false);
  alert("Saved for Pay Later");
};






  /* =====================
     RECEIPT VIEW
  ===================== */
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

  /* =====================
     UI
  ===================== */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* 🔙 BACK TO DASHBOARD (ADMIN ONLY) */}
          {user?.role === "admin" && (
            <button
              onClick={() => setPage("dashboard")}
              className="p-2 rounded-full hover:bg-gray-200 transition"
              title="Back to Dashboard"
            >
              ←
            </button>
          )}

          <h1 className="text-2xl font-bold">🧾 POS Terminal</h1>
        </div>

        <span
          className={`font-bold ${status === "ONLINE"
            ? "text-green-600"
            : status === "SYNCING"
              ? "text-yellow-600"
              : "text-red-600"
            }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* CATEGORIES */}
        <div className="col-span-2 bg-white rounded shadow p-3">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full mb-2 px-3 py-2 rounded ${selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100"
              }`}
          >
            All
          </button>

          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c._id)}
              className={`w-full mb-2 px-3 py-2 rounded ${selectedCategory === c._id
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
                }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* PRODUCTS */}
        <div className="col-span-7 bg-white rounded shadow p-4">
          <form onSubmit={handleScan} className="flex gap-2 mb-4">
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
            <p className="text-red-600 mb-2">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                className={`border rounded p-3 text-left hover:shadow ${p.stock === 0 ? "opacity-50" : ""
                  }`}
              >
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm">${p.price}</p>
                {p.stock === 0 && (
                  <p className="text-xs text-red-600">
                    Out of stock
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="col-span-3 bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Cart</h2>

          {cart.length === 0 && (
            <p className="text-gray-400">Cart is empty</p>
          )}

          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between items-center mb-2"
            >
              {/* PRODUCT INFO */}
              <div>
                <p className="font-medium">{item.name}</p>
                {item.stock === 0 && (
                  <p className="text-xs text-red-600">
                    Out of stock
                  </p>
                )}
              </div>

              {/* QUANTITY CONTROLS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrease(item.productId)}
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  −
                </button>

                <span className="min-w-[20px] text-center">
                  {item.quantity}
                </span>

                <button
                  onClick={() => increase(item.productId)}
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
              </div>

              {/* ITEM TOTAL */}
              <span className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}



          <hr className="my-3" />

          <div className="font-bold text-lg mb-3">
            Total: ${total.toFixed(2)}
          </div>

          <button
            onClick={handleCheckout}
            disabled={status === "SYNCING"}
            className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50"
          >
            Checkout (F9)
          </button>
<div className="relative mt-3">
  <input
    value={customerName}
    onChange={(e) => {
      setCustomerName(e.target.value);
      setShowSuggestions(true);
    }}
    placeholder="Customer name"
    className="w-full border rounded px-3 py-2"
  />

  {/* SUGGESTIONS */}
  {showSuggestions && customerName && filteredNames.length > 0 && (
    <div className="absolute z-10 bg-white border w-full rounded shadow max-h-40 overflow-y-auto">
      {filteredNames.map((name) => (
        <div
          key={name}
          onClick={() => {
            setCustomerName(name);
            setShowSuggestions(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {name}
        </div>
      ))}
    </div>
  )}
</div>



          <button
  onClick={handlePayLater}
  className="bg-yellow-500 text-white px-6 py-4 rounded-lg font-bold"
>
  Pay Later
</button>


        </div>
      </div>
    </div>
  );
}
